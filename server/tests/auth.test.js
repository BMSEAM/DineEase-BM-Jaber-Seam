import { jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { createApp } from '../src/app.js';

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
});
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Auth module', () => {
  const creds = { name: 'Test User', email: 'test@dineease.com', password: 'secret123' };

  test('registers a new customer and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(creds);
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('rejects invalid registration input (validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('logs in with correct credentials and fails with wrong password', async () => {
    await request(app).post('/api/auth/register').send(creds);

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  test('protects /api/auth/me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
