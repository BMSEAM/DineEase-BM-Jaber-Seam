import { jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { RestaurantTable } from '../src/models/RestaurantTable.js';
import { MenuItem } from '../src/models/MenuItem.js';
import { MenuCategory } from '../src/models/MenuCategory.js';
import { Reservation } from '../src/models/Reservation.js';
import { Order } from '../src/models/Order.js';
import { BookingSlot } from '../src/models/BookingSlot.js';
import { CleaningTask } from '../src/models/CleaningTask.js';
import { Payment } from '../src/models/Payment.js';
import { Invoice } from '../src/models/Invoice.js';
import { signToken } from '../src/utils/token.js';
import { ROLES, ORDER_STATUS, RESERVATION_STATUS, TABLE_STATUS } from '../src/config/constants.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
  // Ensure unique indexes exist before the concurrency tests rely on them.
  await Promise.all([
    BookingSlot.init(),
    Payment.init(),
    Invoice.init(),
    CleaningTask.init(),
    RestaurantTable.init(),
    User.init(),
  ]);
});
afterEach(clearTestDB);
afterAll(closeTestDB);

// ---- helpers ----
async function makeUser(role = ROLES.CUSTOMER, over = {}) {
  const user = await User.create({
    name: `${role}-${Math.random().toString(36).slice(2, 7)}`,
    email: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@d.com`,
    password: 'secret123',
    role,
    ...over,
  });
  const token = signToken({ id: user._id, role: user.role });
  return { user, token };
}

async function makeMenuItem(over = {}) {
  const cat = await MenuCategory.create({ name: `Cat-${Math.random().toString(36).slice(2, 6)}` });
  return MenuItem.create({ name: 'Test Dish', price: 100, category: cat._id, isAvailable: true, ...over });
}

function tomorrowAt(time = '19:00') {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: d.toISOString().slice(0, 10), startTime: time };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Reservation concurrency (Priority 1.1)', () => {
  test('exact-overlap parallel requests: exactly one success, one 409', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'C1', capacity: 4 });
    const payload = { table: table._id.toString(), ...tomorrowAt('19:00'), guests: 2 };

    const [a, b] = await Promise.all([
      request(app).post('/api/reservations').set(auth(token)).send(payload),
      request(app).post('/api/reservations').set(auth(token)).send(payload),
    ]);

    const codes = [a.status, b.status].sort();
    expect(codes).toEqual([201, 409]);
    expect(await Reservation.countDocuments({ table: table._id })).toBe(1);
  });

  test('partial-overlap parallel requests conflict on shared slot', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'C2', capacity: 4 });
    const t = tomorrowAt('19:00');

    const [a, b] = await Promise.all([
      request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), ...t, guests: 2 }),
      request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), date: t.date, startTime: '19:30', guests: 2 }),
    ]);

    const codes = [a.status, b.status].sort();
    expect(codes).toEqual([201, 409]);
  });

  test('adjacent non-overlapping windows both succeed', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'C3', capacity: 4 });
    const t = tomorrowAt('18:00'); // 18:00-19:30

    const first = await request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), ...t, guests: 2 });
    const second = await request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), date: t.date, startTime: '19:30', guests: 2 }); // 19:30-21:00

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  test('rejecting a reservation releases its slots for rebooking', async () => {
    const { token } = await makeUser();
    const { token: staff } = await makeUser(ROLES.WAITER);
    const table = await RestaurantTable.create({ tableNumber: 'C4', capacity: 4 });
    const payload = { table: table._id.toString(), ...tomorrowAt('19:00'), guests: 2 };

    const created = await request(app).post('/api/reservations').set(auth(token)).send(payload);
    expect(created.status).toBe(201);
    const id = created.body.data._id;

    await request(app).patch(`/api/reservations/${id}/reject`).set(auth(staff)).send({ reason: 'Closed for event' }).expect(200);
    expect(await BookingSlot.countDocuments({ reservation: id })).toBe(0);

    // Same slot can now be booked again.
    const again = await request(app).post('/api/reservations').set(auth(token)).send(payload);
    expect(again.status).toBe(201);
  });
});

describe('Atomic reservation + pre-order (Priority 1.2)', () => {
  test('invalid pre-order item leaves no reservation, order or slot', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'A1', capacity: 4 });
    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      table: table._id.toString(),
      ...tomorrowAt('19:00'),
      guests: 2,
      items: [{ menuItem: '64b7f0000000000000000000', quantity: 1 }], // non-existent
    });

    expect(res.status).toBe(400);
    expect(await Reservation.countDocuments({})).toBe(0);
    expect(await Order.countDocuments({})).toBe(0);
    expect(await BookingSlot.countDocuments({})).toBe(0);
  });

  test('valid pre-order creates reservation + linked dine-in order', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'A2', capacity: 4 });
    const item = await makeMenuItem({ price: 250 });
    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      table: table._id.toString(),
      ...tomorrowAt('19:00'),
      guests: 2,
      items: [{ menuItem: item._id.toString(), quantity: 2 }],
    });
    expect(res.status).toBe(201);
    const order = await Order.findOne({ reservation: res.body.data._id });
    expect(order).toBeTruthy();
    expect(order.type).toBe('dine_in');
    expect(order.subtotal).toBe(500);
  });
});

describe('Strict date & seating validation (Priority 1.4)', () => {
  test('rejects an impossible calendar date (2026-02-31)', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'D1', capacity: 4 });
    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      table: table._id.toString(),
      date: '2026-02-31',
      startTime: '19:00',
      guests: 2,
    });
    expect(res.status).toBe(400);
  });

  test('revalidates seating preference against the table', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'D2', capacity: 4, seatingPreference: 'indoor' });
    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      table: table._id.toString(),
      ...tomorrowAt('19:00'),
      guests: 2,
      seatingPreference: 'outdoor',
    });
    expect(res.status).toBe(400);
  });
});

describe('Table availability & status separation (Priority 1.5)', () => {
  test('approving a future reservation does not change the table status', async () => {
    const { token } = await makeUser();
    const { token: staff } = await makeUser(ROLES.WAITER);
    const table = await RestaurantTable.create({ tableNumber: 'E1', capacity: 4 });
    const created = await request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), ...tomorrowAt('19:00'), guests: 2 });
    const id = created.body.data._id;
    await request(app).patch(`/api/reservations/${id}/approve`).set(auth(staff)).expect(200);

    const fresh = await RestaurantTable.findById(table._id);
    expect(fresh.status).toBe(TABLE_STATUS.AVAILABLE); // NOT globally 'reserved'
  });
});

describe('Ordering without a reservation (Priority 2)', () => {
  test('standalone takeaway order succeeds with no reservation', async () => {
    const { token } = await makeUser();
    const item = await makeMenuItem();
    const res = await request(app).post('/api/orders').set(auth(token)).send({
      items: [{ menuItem: item._id.toString(), quantity: 1 }],
      type: 'takeaway',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('takeaway');
    expect(res.body.data.reservation).toBeFalsy();
  });

  test('standalone dine-in (tableless) order is rejected', async () => {
    const { token } = await makeUser();
    const item = await makeMenuItem();
    const res = await request(app).post('/api/orders').set(auth(token)).send({
      items: [{ menuItem: item._id.toString(), quantity: 1 }],
      type: 'dine_in',
    });
    expect(res.status).toBe(400);
  });

  test('unavailable item is rejected', async () => {
    const { token } = await makeUser();
    const item = await makeMenuItem({ isAvailable: false });
    const res = await request(app).post('/api/orders').set(auth(token)).send({
      items: [{ menuItem: item._id.toString(), quantity: 1 }],
      type: 'takeaway',
    });
    expect(res.status).toBe(400);
  });

  test('concurrent attach to one reservation yields a single order', async () => {
    const { token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'O1', capacity: 4 });
    const item = await makeMenuItem();
    const created = await request(app).post('/api/reservations').set(auth(token)).send({ table: table._id.toString(), ...tomorrowAt('19:00'), guests: 2 });
    const reservationId = created.body.data._id;

    const body = { items: [{ menuItem: item._id.toString(), quantity: 1 }], reservation: reservationId };
    const [a, b] = await Promise.all([
      request(app).post('/api/orders').set(auth(token)).send(body),
      request(app).post('/api/orders').set(auth(token)).send(body),
    ]);
    const codes = [a.status, b.status].sort();
    expect(codes).toEqual([201, 409]);
    expect(await Order.countDocuments({ reservation: reservationId })).toBe(1);
  });
});

describe('Payment correctness & idempotency (Priority 1.6)', () => {
  async function placedOrder(token, customer) {
    const item = await makeMenuItem({ price: 100 });
    return Order.create({
      customer,
      type: 'takeaway',
      items: [{ menuItem: item._id, name: item.name, unitPrice: 100, quantity: 1, lineTotal: 100 }],
      subtotal: 100,
      status: ORDER_STATUS.PLACED,
    });
  }

  test('a cancelled order cannot be paid', async () => {
    const { user, token } = await makeUser();
    const order = await placedOrder(token, user._id);
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
    const res = await request(app).post('/api/payments').set(auth(token)).send({ order: order._id.toString(), method: 'bkash' });
    expect(res.status).toBe(400);
  });

  test('payment does not change kitchen fulfillment status', async () => {
    const { user, token } = await makeUser();
    const order = await placedOrder(token, user._id); // status: placed
    const res = await request(app).post('/api/payments').set(auth(token)).send({ order: order._id.toString(), method: 'bkash' });
    expect(res.status).toBe(201);
    const fresh = await Order.findById(order._id);
    expect(fresh.isPaid).toBe(true);
    expect(fresh.status).toBe(ORDER_STATUS.PLACED); // fulfillment untouched
  });

  test('concurrent payments create exactly one success + one invoice', async () => {
    const { user, token } = await makeUser();
    const order = await placedOrder(token, user._id);
    const body = { order: order._id.toString(), method: 'nagad' };
    const [a, b] = await Promise.all([
      request(app).post('/api/payments').set(auth(token)).send(body),
      request(app).post('/api/payments').set(auth(token)).send(body),
    ]);
    const codes = [a.status, b.status].sort();
    expect(codes[0]).toBe(201);
    expect(await Payment.countDocuments({ order: order._id, status: 'success' })).toBe(1);
    expect(await Invoice.countDocuments({ order: order._id })).toBe(1);
  });

  test('repeated payment after success is rejected', async () => {
    const { user, token } = await makeUser();
    const order = await placedOrder(token, user._id);
    const body = { order: order._id.toString(), method: 'bkash' };
    await request(app).post('/api/payments').set(auth(token)).send(body).expect(201);
    const again = await request(app).post('/api/payments').set(auth(token)).send(body);
    expect(again.status).toBe(409);
    expect(await Payment.countDocuments({ order: order._id, status: 'success' })).toBe(1);
  });

  test('a paid order cannot be cancelled', async () => {
    const { user, token } = await makeUser();
    const { token: staff } = await makeUser(ROLES.WAITER);
    const order = await placedOrder(token, user._id);
    await request(app).post('/api/payments').set(auth(token)).send({ order: order._id.toString(), method: 'bkash' }).expect(201);
    const res = await request(app).patch(`/api/orders/${order._id}/status`).set(auth(staff)).send({ status: 'cancelled' });
    expect(res.status).toBe(400);
  });
});

describe('Cleaning workflow (Priority 1.7)', () => {
  async function approvedPastReservation(customerId, waiterToken) {
    const table = await RestaurantTable.create({ tableNumber: `K${Math.random().toString(36).slice(2, 5)}`, capacity: 4 });
    const start = new Date(Date.now() - 30 * 60000); // 30 min ago
    return Reservation.create({
      customer: customerId,
      table: table._id,
      date: start.toISOString().slice(0, 10),
      startTime: '00:00',
      endTime: '01:30',
      startAt: start,
      endAt: new Date(start.getTime() + 90 * 60000),
      guests: 2,
      status: RESERVATION_STATUS.APPROVED,
    });
  }

  test('cannot complete dining before the reservation window', async () => {
    const { user } = await makeUser();
    const { token: staff } = await makeUser(ROLES.WAITER);
    const start = new Date(Date.now() + 24 * 3600 * 1000);
    const table = await RestaurantTable.create({ tableNumber: 'KF', capacity: 4 });
    const reservation = await Reservation.create({
      customer: user._id, table: table._id, date: start.toISOString().slice(0, 10),
      startTime: '19:00', endTime: '20:30', startAt: start, endAt: new Date(start.getTime() + 90 * 60000),
      guests: 2, status: RESERVATION_STATUS.APPROVED,
    });
    const res = await request(app).patch(`/api/cleaning/reservations/${reservation._id}/complete`).set(auth(staff));
    expect(res.status).toBe(400);
  });

  test('completing dining is idempotent and creates only one cleaning task', async () => {
    const { user } = await makeUser();
    const { token: staff } = await makeUser(ROLES.WAITER);
    const reservation = await approvedPastReservation(user._id, staff);

    const [a, b] = await Promise.all([
      request(app).patch(`/api/cleaning/reservations/${reservation._id}/complete`).set(auth(staff)),
      request(app).patch(`/api/cleaning/reservations/${reservation._id}/complete`).set(auth(staff)),
    ]);
    expect([a.status, b.status].every((s) => s === 200 || s === 201)).toBe(true);
    expect(await CleaningTask.countDocuments({ reservation: reservation._id })).toBe(1);
  });
});

describe('Role authorization on changed endpoints', () => {
  test('a customer cannot approve reservations', async () => {
    const { user, token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'R1', capacity: 4 });
    const reservation = await Reservation.create({
      customer: user._id, table: table._id, date: '2030-01-01', startTime: '19:00', endTime: '20:30',
      startAt: new Date('2030-01-01T19:00:00'), endAt: new Date('2030-01-01T20:30:00'), guests: 2,
    });
    const res = await request(app).patch(`/api/reservations/${reservation._id}/approve`).set(auth(token));
    expect(res.status).toBe(403);
  });

  test('a customer cannot list the kitchen order queue', async () => {
    const { token } = await makeUser();
    const res = await request(app).get('/api/orders').set(auth(token));
    expect(res.status).toBe(403);
  });
});
