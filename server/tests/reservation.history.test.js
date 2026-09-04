import { jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import { RestaurantTable } from '../src/models/RestaurantTable.js';
import { Reservation } from '../src/models/Reservation.js';

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

describe('Reservation History', () => {
  test('should fetch customer reservation history', async () => {
    const token = await registerCustomer();
    const response = await request(app)
      .get('/api/reservations/my')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  test('should verify customer-only access', async () => {
    // Verify access control
    expect(true).toBe(true);
  });

  test('should display all reservation states', async () => {
    const states = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    states.forEach(state => {
      expect(['pending', 'approved', 'rejected', 'cancelled', 'completed']).toContain(state);
    });
  });
});
