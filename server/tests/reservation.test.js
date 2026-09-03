import { jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import { RestaurantTable } from '../src/models/RestaurantTable.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
});
afterEach(clearTestDB);
afterAll(closeTestDB);

async function registerCustomer() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cust', email: `c${Date.now()}@d.com`, password: 'secret123' });
  return res.body.data.token;
}

// A future date string (tomorrow) to keep reservations valid.
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe('Reservations (F03) — double booking prevention', () => {
  test('prevents overlapping reservations on the same table', async () => {
    const token = await registerCustomer();
    const table = await RestaurantTable.create({ tableNumber: 'X1', capacity: 4 });

    const payload = {
      table: table._id.toString(),
      date: tomorrow(),
      startTime: '19:00',
      guests: 2,
    };

    const first = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);

    // Overlapping window (default duration 90 min) -> conflict.
    const second = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, startTime: '19:30' });
    expect(second.status).toBe(409);
  });

  test('rejects guests exceeding table capacity', async () => {
    const token = await registerCustomer();
    const table = await RestaurantTable.create({ tableNumber: 'X2', capacity: 2 });
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ table: table._id.toString(), date: tomorrow(), startTime: '12:00', guests: 5 });
    expect(res.status).toBe(400);
  });
});
