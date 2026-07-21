import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { MenuItem } from '../src/models/MenuItem.js';
import { MenuCategory } from '../src/models/MenuCategory.js';
import { RestaurantTable } from '../src/models/RestaurantTable.js';
import { Reservation } from '../src/models/Reservation.js';
import { Order } from '../src/models/Order.js';
import { Review } from '../src/models/Review.js';
import { signToken } from '../src/utils/token.js';
import { ROLES, RESERVATION_STATUS, ORDER_STATUS } from '../src/config/constants.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
  await Promise.all([MenuCategory.init(), Review.init()]);
});
afterEach(clearTestDB);
afterAll(closeTestDB);

async function makeUser(role = ROLES.CUSTOMER) {
  const user = await User.create({
    name: `${role}-${Math.random().toString(36).slice(2, 7)}`,
    email: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@d.com`,
    password: 'secret123',
    role,
  });
  return { user, token: signToken({ id: user._id, role: user.role }) };
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function completedReservation(customerId) {
  const table = await RestaurantTable.create({ tableNumber: `RV${Math.random().toString(36).slice(2, 5)}`, capacity: 4 });
  const start = new Date(Date.now() - 3600 * 1000);
  return Reservation.create({
    customer: customerId, table: table._id, date: start.toISOString().slice(0, 10),
    startTime: '10:00', endTime: '11:30', startAt: start, endAt: new Date(start.getTime() + 90 * 60000),
    guests: 2, status: RESERVATION_STATUS.COMPLETED,
  });
}

describe('P0.3 Category remove/edit', () => {
  test('deleting an in-use category returns 409, not orphaning items', async () => {
    const { token } = await makeUser(ROLES.ADMIN);
    const cat = await MenuCategory.create({ name: 'InUse' });
    await MenuItem.create({ name: 'Dish', price: 100, category: cat._id });
    const res = await request(app).delete(`/api/categories/${cat._id}`).set(auth(token));
    expect(res.status).toBe(409);
    expect(await MenuCategory.countDocuments({ _id: cat._id })).toBe(1);
  });

  test('deleting an unused category succeeds', async () => {
    const { token } = await makeUser(ROLES.ADMIN);
    const cat = await MenuCategory.create({ name: 'Unused' });
    await request(app).delete(`/api/categories/${cat._id}`).set(auth(token)).expect(200);
    expect(await MenuCategory.countDocuments({ _id: cat._id })).toBe(0);
  });

  test('renaming a category persists and rejects a duplicate name', async () => {
    const { token } = await makeUser(ROLES.ADMIN);
    const a = await MenuCategory.create({ name: 'Alpha' });
    const b = await MenuCategory.create({ name: 'Beta' });
    await request(app).patch(`/api/categories/${a._id}`).set(auth(token)).send({ name: 'Alpha2' }).expect(200);
    expect((await MenuCategory.findById(a._id)).name).toBe('Alpha2');
    const dup = await request(app).patch(`/api/categories/${b._id}`).set(auth(token)).send({ name: 'Alpha2' });
    expect(dup.status).toBe(409);
  });

  test('a non-admin cannot delete a category', async () => {
    const { token } = await makeUser(ROLES.WAITER);
    const cat = await MenuCategory.create({ name: 'Guarded' });
    const res = await request(app).delete(`/api/categories/${cat._id}`).set(auth(token));
    expect(res.status).toBe(403);
  });
});

describe('P0.5 Review flow', () => {
  test('owner of a completed reservation can review once; duplicate is 409', async () => {
    const { user, token } = await makeUser();
    const reservation = await completedReservation(user._id);
    const body = { reservation: reservation._id.toString(), rating: 5, comment: 'Great' };
    await request(app).post('/api/reviews').set(auth(token)).send(body).expect(201);
    const dup = await request(app).post('/api/reviews').set(auth(token)).send(body);
    expect(dup.status).toBe(409);
  });

  test('cannot review a non-completed reservation (400)', async () => {
    const { user, token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'PN1', capacity: 4 });
    const start = new Date(Date.now() + 3600 * 1000);
    const reservation = await Reservation.create({
      customer: user._id, table: table._id, date: start.toISOString().slice(0, 10),
      startTime: '19:00', endTime: '20:30', startAt: start, endAt: new Date(start.getTime() + 90 * 60000),
      guests: 2, status: RESERVATION_STATUS.PENDING,
    });
    const res = await request(app).post('/api/reviews').set(auth(token)).send({ reservation: reservation._id.toString(), rating: 4 });
    expect(res.status).toBe(400);
  });

  test('cannot review someone else’s reservation (403)', async () => {
    const owner = await makeUser();
    const { token: other } = await makeUser();
    const reservation = await completedReservation(owner.user._id);
    const res = await request(app).post('/api/reviews').set(auth(other)).send({ reservation: reservation._id.toString(), rating: 5 });
    expect(res.status).toBe(403);
  });

  test('rating out of range is rejected (validation 400)', async () => {
    const { user, token } = await makeUser();
    const reservation = await completedReservation(user._id);
    const res = await request(app).post('/api/reviews').set(auth(token)).send({ reservation: reservation._id.toString(), rating: 9 });
    expect(res.status).toBe(400);
  });

  test('public feed reports a truthful average with no fabricated rating', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.meta.averageRating).toBe(0);
  });

  test('owner can edit and delete their review; others cannot', async () => {
    const { user, token } = await makeUser();
    const { token: other } = await makeUser();
    const reservation = await completedReservation(user._id);
    const created = await request(app).post('/api/reviews').set(auth(token)).send({ reservation: reservation._id.toString(), rating: 3, comment: 'ok' });
    const id = created.body.data._id;

    const foreignEdit = await request(app).patch(`/api/reviews/${id}`).set(auth(other)).send({ rating: 1 });
    expect(foreignEdit.status).toBe(403);

    const edit = await request(app).patch(`/api/reviews/${id}`).set(auth(token)).send({ rating: 5, comment: 'actually great' });
    expect(edit.status).toBe(200);
    expect((await Review.findById(id)).rating).toBe(5);

    const foreignDel = await request(app).delete(`/api/reviews/${id}`).set(auth(other));
    expect(foreignDel.status).toBe(403);

    await request(app).delete(`/api/reviews/${id}`).set(auth(token)).expect(200);
    expect(await Review.countDocuments({ _id: id })).toBe(0);
  });

  test('public review feed exposes the visit context (date/table)', async () => {
    const { user, token } = await makeUser();
    const reservation = await completedReservation(user._id);
    await request(app).post('/api/reviews').set(auth(token)).send({ reservation: reservation._id.toString(), rating: 4 }).expect(201);
    const feed = await request(app).get('/api/reviews');
    expect(feed.body.data[0].reservation).toBeTruthy();
    expect(feed.body.data[0].reservation.date).toBeTruthy();
  });
});

describe('Cleaning tasks — manual creation & non-table areas', () => {
  test('admin can create a floor cleaning task with no table (201)', async () => {
    const { token } = await makeUser(ROLES.ADMIN);
    const res = await request(app).post('/api/cleaning/tasks').set(auth(token)).send({ area: 'floor', location: 'Main hall', description: 'Mop after lunch' });
    expect(res.status).toBe(201);
    expect(res.body.data.area).toBe('floor');
    expect(res.body.data.table).toBeFalsy();
  });

  test('a cleaner cannot create a task (assigning is admin-only)', async () => {
    const { token } = await makeUser(ROLES.CLEANER);
    const res = await request(app).post('/api/cleaning/tasks').set(auth(token)).send({ area: 'window', location: 'Front window' });
    expect(res.status).toBe(403);
  });

  test('a table task without a table id is rejected (400)', async () => {
    const { token } = await makeUser(ROLES.ADMIN);
    const res = await request(app).post('/api/cleaning/tasks').set(auth(token)).send({ area: 'table' });
    expect(res.status).toBe(400);
  });

  test('a waiter cannot create a cleaning task (403)', async () => {
    const { token } = await makeUser(ROLES.WAITER);
    const res = await request(app).post('/api/cleaning/tasks').set(auth(token)).send({ area: 'floor' });
    expect(res.status).toBe(403);
  });

  test('admin assigns a non-table task; a cleaner starts and completes it', async () => {
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const { token: cleaner } = await makeUser(ROLES.CLEANER);
    const created = await request(app).post('/api/cleaning/tasks').set(auth(admin)).send({ area: 'restroom', location: 'Ground floor' });
    const id = created.body.data._id;
    await request(app).patch(`/api/cleaning/tasks/${id}/start`).set(auth(cleaner)).expect(200);
    const done = await request(app).patch(`/api/cleaning/tasks/${id}/ready`).set(auth(cleaner));
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('done');
  });

  test('an admin cannot perform the cleaning (start/ready is cleaner-only)', async () => {
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const created = await request(app).post('/api/cleaning/tasks').set(auth(admin)).send({ area: 'floor', location: 'Hall' });
    const id = created.body.data._id;
    const start = await request(app).patch(`/api/cleaning/tasks/${id}/start`).set(auth(admin));
    expect(start.status).toBe(403);
  });

  test('a created table task shows in the cleaner queue', async () => {
    const { token: admin } = await makeUser(ROLES.ADMIN);
    const { token: cleaner } = await makeUser(ROLES.CLEANER);
    const table = await RestaurantTable.create({ tableNumber: 'CT1', capacity: 4 });
    await request(app).post('/api/cleaning/tasks').set(auth(admin)).send({ area: 'table', table: table._id.toString() }).expect(201);
    const list = await request(app).get('/api/cleaning/tasks').set(auth(cleaner));
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);
  });
});

describe('P0.5b Reviewing a standalone takeaway order (no reservation)', () => {
  async function takeawayOrder(customerId, status = ORDER_STATUS.SERVED, over = {}) {
    return Order.create({
      customer: customerId, type: 'takeaway',
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Burger', unitPrice: 500, quantity: 1, lineTotal: 500 }],
      subtotal: 500, status, ...over,
    });
  }

  test('a served takeaway order can be reviewed once; duplicate is 409', async () => {
    const { user, token } = await makeUser();
    const order = await takeawayOrder(user._id, ORDER_STATUS.SERVED);
    const body = { order: order._id.toString(), rating: 5, comment: 'Tasty' };
    await request(app).post('/api/reviews').set(auth(token)).send(body).expect(201);
    const dup = await request(app).post('/api/reviews').set(auth(token)).send(body);
    expect(dup.status).toBe(409);
  });

  test('a not-yet-served order cannot be reviewed (400)', async () => {
    const { user, token } = await makeUser();
    const order = await takeawayOrder(user._id, ORDER_STATUS.PLACED);
    const res = await request(app).post('/api/reviews').set(auth(token)).send({ order: order._id.toString(), rating: 4 });
    expect(res.status).toBe(400);
  });

  test('a reservation-linked order must be reviewed via the reservation (400)', async () => {
    const { user, token } = await makeUser();
    const table = await RestaurantTable.create({ tableNumber: 'RO1', capacity: 4 });
    const start = new Date(Date.now() - 3600 * 1000);
    const reservation = await Reservation.create({
      customer: user._id, table: table._id, date: start.toISOString().slice(0, 10),
      startTime: '10:00', endTime: '11:30', startAt: start, endAt: new Date(start.getTime() + 90 * 60000),
      guests: 2, status: RESERVATION_STATUS.COMPLETED,
    });
    const order = await takeawayOrder(user._id, ORDER_STATUS.SERVED, { reservation: reservation._id, type: 'dine_in' });
    const res = await request(app).post('/api/reviews').set(auth(token)).send({ order: order._id.toString(), rating: 5 });
    expect(res.status).toBe(400);
  });

  test('cannot review another customer’s order (403)', async () => {
    const owner = await makeUser();
    const { token: other } = await makeUser();
    const order = await takeawayOrder(owner.user._id, ORDER_STATUS.COMPLETED);
    const res = await request(app).post('/api/reviews').set(auth(other)).send({ order: order._id.toString(), rating: 5 });
    expect(res.status).toBe(403);
  });

  test('a review with neither reservation nor order is rejected (400)', async () => {
    const { token } = await makeUser();
    const res = await request(app).post('/api/reviews').set(auth(token)).send({ rating: 5 });
    expect(res.status).toBe(400);
  });
});

describe('P1 Customer-only authorization', () => {
  test('a waiter token cannot read the customer loyalty endpoint (403)', async () => {
    const { token } = await makeUser(ROLES.WAITER);
    const res = await request(app).get('/api/loyalty').set(auth(token));
    expect(res.status).toBe(403);
  });

  test('a customer can read their loyalty endpoint (200)', async () => {
    const { token } = await makeUser();
    const res = await request(app).get('/api/loyalty').set(auth(token));
    expect(res.status).toBe(200);
  });
});

describe('P1 Malformed menu search is safe', () => {
  test('an invalid regex search returns 200, not a 500 stack trace', async () => {
    await MenuItem.create({ name: 'Bracket [Special]', price: 100, category: (await MenuCategory.create({ name: 'C' }))._id });
    const res = await request(app).get('/api/menu-items').query({ search: '[' });
    expect(res.status).toBe(200);
  });
});

describe('P0.4 Waiter/Cleaner role separation', () => {
  test('a waiter cannot access the cleaner queue (403), a cleaner can (200)', async () => {
    const { token: waiter } = await makeUser(ROLES.WAITER);
    const { token: cleaner } = await makeUser(ROLES.CLEANER);
    expect((await request(app).get('/api/cleaning/tasks').set(auth(waiter))).status).toBe(403);
    expect((await request(app).get('/api/cleaning/tasks').set(auth(cleaner))).status).toBe(200);
  });

  test('a cleaner cannot approve reservations (403)', async () => {
    const { user } = await makeUser();
    const { token: cleaner } = await makeUser(ROLES.CLEANER);
    const table = await RestaurantTable.create({ tableNumber: 'CS1', capacity: 4 });
    const start = new Date(Date.now() + 3600 * 1000);
    const reservation = await Reservation.create({
      customer: user._id, table: table._id, date: start.toISOString().slice(0, 10),
      startTime: '19:00', endTime: '20:30', startAt: start, endAt: new Date(start.getTime() + 90 * 60000),
      guests: 2, status: RESERVATION_STATUS.PENDING,
    });
    const res = await request(app).patch(`/api/reservations/${reservation._id}/approve`).set(auth(cleaner));
    expect(res.status).toBe(403);
  });
});
