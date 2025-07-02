import request from 'supertest';
import app from './server';

describe('API Endpoints', () => {
  // Auth endpoints
  it('POST /api/auth/register should fail without body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
  it('POST /api/auth/login should fail without body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
  // Add more tests for each endpoint as needed, e.g. GET /api/users/profile, etc.
  // ...
}); 