import { jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { MenuItem } from '../src/models/MenuItem.js';
import { MenuCategory } from '../src/models/MenuCategory.js';
import { Order } from '../src/models/Order.js';
import { Payment } from '../src/models/Payment.js';
import { Refund } from '../src/models/Refund.js';
import { LoyaltyTransaction } from '../src/models/LoyaltyTransaction.js';
import { signToken } from '../src/utils/token.js';
import { ROLES, ORDER_STATUS, PAYMENT_STATUS } from '../src/config/constants.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
  await Promise.all([Payment.init(), Refund.init()]);
});
afterEach(clearTestDB);
afterAll(closeTestDB);

async function makeUser(role = ROLES.CUSTOMER, over = {}) {
  const user = await User.create({
    name: `${role}-${Math.random().toString(36).slice(2, 7)}`,
    email: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@d.com`,
    password: 'secret123',
    role,
    ...over,
  });
  return { user, token: signToken({ id: user._id, role: user.role }) };
}

async function makeMenuItem(over = {}) {
  const cat = await MenuCategory.create({ name: `Cat-${Math.random().toString(36).slice(2, 6)}` });
  return MenuItem.create({ name: 'Dish', price: 1000, category: cat._id, isAvailable: true, ...over });
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

// Create an order for `customer` and pay it via the real payment endpoint so the
// loyalty ledger is realistic.
async function paidOrder(token, customerId, { redeem = 0, subtotal = 1000 } = {}) {
  const item = await makeMenuItem({ price: subtotal });
  const order = await Order.create({
    customer: customerId,
    type: 'takeaway',
    items: [{ menuItem: item._id, name: item.name, unitPrice: subtotal, quantity: 1, lineTotal: subtotal }],
    subtotal,
    status: ORDER_STATUS.PLACED,
  });
  await request(app)
    .post('/api/payments')
    .set(auth(token))
    .send({ order: order._id.toString(), method: 'bkash', redeemPoints: redeem })
    .expect(201);
  return order;
}

describe('Refund extension — eligibility & authorization', () => {
  test('unpaid order cannot be refunded (400)', async () => {
    const { user, token } = await makeUser();
    const item = await makeMenuItem();
    const order = await Order.create({
      customer: user._id, type: 'takeaway',
      items: [{ menuItem: item._id, name: 'Dish', unitPrice: 1000, quantity: 1, lineTotal: 1000 }],
      subtotal: 1000, status: ORDER_STATUS.PLACED,
    });
    const res = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    expect(res.status).toBe(400);
  });

  test('customer can request a refund for a paid order (201, pending)', async () => {
    const { user, token } = await makeUser();
    const order = await paidOrder(token, user._id);
    const res = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString(), reason: 'Changed my mind' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });

  test('a customer cannot refund another customer’s order (403)', async () => {
    const { user } = await makeUser();
    const { token: other } = await makeUser();
    const owner = await makeUser();
    const order = await paidOrder(owner.token, owner.user._id);
    const res = await request(app).post('/api/refunds').set(auth(other)).send({ order: order._id.toString() });
    expect(res.status).toBe(403);
  });

  test('waiter and cleaner cannot request or process refunds (403)', async () => {
    const { user, token } = await makeUser();
    const order = await paidOrder(token, user._id);
    const { token: waiter } = await makeUser(ROLES.WAITER);
    const { token: cleaner } = await makeUser(ROLES.CLEANER);

    const wReq = await request(app).post('/api/refunds').set(auth(waiter)).send({ order: order._id.toString() });
    expect(wReq.status).toBe(403);

    const refund = await Refund.create({
      order: order._id, payment: (await Payment.findOne({ order: order._id }))._id,
      customer: user._id, amount: 1050, idempotencyKey: 'k1', requestedBy: user._id,
    });
    const wProc = await request(app).post(`/api/refunds/${refund._id}/process`).set(auth(waiter));
    expect(wProc.status).toBe(403);
    const cProc = await request(app).post(`/api/refunds/${refund._id}/process`).set(auth(cleaner));
    expect(cProc.status).toBe(403);
  });
});

describe('Refund extension — idempotency & concurrency', () => {
  test('duplicate request returns the same refund, never two', async () => {
    const { user, token } = await makeUser();
    const order = await paidOrder(token, user._id);
    const body = { order: order._id.toString() };
    await request(app).post('/api/refunds').set(auth(token)).send(body).expect(201);
    const second = await request(app).post('/api/refunds').set(auth(token)).send(body);
    expect(second.status).toBe(200); // returned existing
    expect(await Refund.countDocuments({ order: order._id })).toBe(1);
  });

  test('concurrent requests create exactly one refund', async () => {
    const { user, token } = await makeUser();
    const order = await paidOrder(token, user._id);
    const body = { order: order._id.toString() };
    await Promise.all([
      request(app).post('/api/refunds').set(auth(token)).send(body),
      request(app).post('/api/refunds').set(auth(token)).send(body),
    ]);
    expect(await Refund.countDocuments({ order: order._id, status: { $in: ['pending', 'approved'] } })).toBe(1);
  });

  test('replaying the same idempotencyKey returns the original', async () => {
    const { user, token } = await makeUser();
    const order = await paidOrder(token, user._id);
    const body = { order: order._id.toString(), idempotencyKey: 'client-key-123' };
    const a = await request(app).post('/api/refunds').set(auth(token)).send(body);
    const b = await request(app).post('/api/refunds').set(auth(token)).send(body);
    expect(String(a.body.data._id)).toBe(String(b.body.data._id));
    expect(await Refund.countDocuments({ order: order._id })).toBe(1);
  });

  test('concurrent admin processing reverses loyalty exactly once', async () => {
    const { user, token } = await makeUser();
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const order = await paidOrder(token, user._id); // earns 52 pts (1050 * 0.05)
    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    const id = created.body.data._id;

    const [a, b] = await Promise.all([
      request(app).post(`/api/refunds/${id}/process`).set(auth(admin)),
      request(app).post(`/api/refunds/${id}/process`).set(auth(admin)),
    ]);
    expect([a.status, b.status].every((s) => s === 200)).toBe(true);
    expect(await LoyaltyTransaction.countDocuments({ customer: user._id, type: 'refund_reverse' })).toBe(1);
    expect(await Payment.countDocuments({ order: order._id, status: PAYMENT_STATUS.REFUNDED })).toBe(1);
  });
});

describe('Refund extension — execution effects', () => {
  test('processing refunds payment, marks order refunded and reverses earned points', async () => {
    const { user, token } = await makeUser();
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const order = await paidOrder(token, user._id);

    const before = await User.findById(user._id);
    expect(before.loyaltyPoints).toBe(52); // 1050 * 0.05 floored

    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    const proc = await request(app).post(`/api/refunds/${created.body.data._id}/process`).set(auth(admin));
    expect(proc.status).toBe(200);
    expect(proc.body.data.status).toBe('approved');

    const after = await User.findById(user._id);
    expect(after.loyaltyPoints).toBe(0); // earned points clawed back, never negative
    const freshOrder = await Order.findById(order._id);
    expect(freshOrder.isRefunded).toBe(true);
    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe(PAYMENT_STATUS.REFUNDED);
  });

  test('redeemed points are restored on refund', async () => {
    const { user, token } = await makeUser(ROLES.CUSTOMER, { loyaltyPoints: 100 });
    const { token: admin } = await makeUser(ROLES.ADMIN);
    // Pay redeeming 40 points; earns points on the discounted total.
    const order = await paidOrder(token, user._id, { redeem: 40, subtotal: 1000 });
    // Pay: 100 − 40 redeemed + earned(floor(1008 × 0.05)=50) = 110.
    const afterPay = await User.findById(user._id);
    expect(afterPay.loyaltyPoints).toBe(110);

    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    await request(app).post(`/api/refunds/${created.body.data._id}/process`).set(auth(admin)).expect(200);
    const afterRefund = await User.findById(user._id);
    // Refund reverses the 50 earned and restores the 40 redeemed → back to 100.
    expect(afterRefund.loyaltyPoints).toBe(100);
  });

  test('simulated gateway failure marks refund failed and reverses nothing', async () => {
    const { user, token } = await makeUser();
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const order = await paidOrder(token, user._id);
    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    const proc = await request(app).post(`/api/refunds/${created.body.data._id}/process`).set(auth(admin)).send({ simulate: 'fail' });
    expect(proc.status).toBe(400);

    const refund = await Refund.findById(created.body.data._id);
    expect(refund.status).toBe('failed');
    const payment = await Payment.findOne({ order: order._id });
    expect(payment.status).toBe(PAYMENT_STATUS.SUCCESS); // untouched
    const freshUser = await User.findById(user._id);
    expect(freshUser.loyaltyPoints).toBe(52); // unchanged
  });

  test('admin report net revenue excludes a refunded payment', async () => {
    const { user, token } = await makeUser();
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const order = await paidOrder(token, user._id); // total 1050

    const before = await request(app).get('/api/admin/reports').query({ period: 'daily' }).set(auth(admin));
    expect(before.body.data.revenue).toBe(1050);

    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    await request(app).post(`/api/refunds/${created.body.data._id}/process`).set(auth(admin)).expect(200);

    const after = await request(app).get('/api/admin/reports').query({ period: 'daily' }).set(auth(admin));
    expect(after.body.data.revenue).toBe(0); // refunded payment no longer counts
  });

  test('a refunded order cannot be refunded again', async () => {
    const { user, token } = await makeUser();
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const order = await paidOrder(token, user._id);
    const created = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    await request(app).post(`/api/refunds/${created.body.data._id}/process`).set(auth(admin)).expect(200);
    const again = await request(app).post('/api/refunds').set(auth(token)).send({ order: order._id.toString() });
    expect(again.status).toBe(409);
  });
});
