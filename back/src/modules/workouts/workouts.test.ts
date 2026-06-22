import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, createTestUser, loginTestUser } from '../../test/helpers.js';

let app: FastifyInstance;
let token: string;
let otherToken: string;

beforeAll(async () => {
  app = await createTestApp();
});

beforeEach(async () => {
  await createTestUser(app);
  const res = await loginTestUser(app, 'test@example.com', 'password123');
  token = res.data.token;

  await createTestUser(app, { name: 'Other User', email: 'other@example.com', password: 'password123' });
  const res2 = await loginTestUser(app, 'other@example.com', 'password123');
  otherToken = res2.data.token;
});

afterAll(async () => {
  await app.close();
});

async function createTestWorkout(t: string, name = 'Push Day') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/workouts',
    headers: { Authorization: `Bearer ${t}` },
    payload: { name },
  });
  return res.json<{ data: { _id: string; name: string } }>();
}

describe('GET /api/v1/workouts', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/workouts' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with empty array initially', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: unknown[] }>().data).toBeInstanceOf(Array);
  });
});

describe('POST /api/v1/workouts', () => {
  it('creates a workout and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Pull Day' },
    });
    expect(res.statusCode).toBe(201);
    const { data } = res.json<{ data: Record<string, unknown> }>();
    expect(data.name).toBe('Pull Day');
    expect(data).toHaveProperty('_id');
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      payload: { name: 'Leg Day' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/workouts/:id', () => {
  it('returns 200 for own workout', async () => {
    const { data: created } = await createTestWorkout(token, 'Leg Day');
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: { _id: string } }>().data._id).toBe(created._id);
  });

  it('returns 403 when accessing another user workout', async () => {
    const { data: created } = await createTestWorkout(token, 'My Workout');
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for non-existent workout', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts/000000000000000000000001',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/v1/workouts/:id', () => {
  it('updates workout name and returns 200', async () => {
    const { data: created } = await createTestWorkout(token, 'Old Name');
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'New Name' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: { name: string } }>().data.name).toBe('New Name');
  });

  it('returns 403 when updating another user workout', async () => {
    const { data: created } = await createTestWorkout(token, 'My Workout');
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
      payload: { name: 'Hacked' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /api/v1/workouts/:id', () => {
  it('deletes own workout and returns 204', async () => {
    const { data: created } = await createTestWorkout(token, 'To Delete');
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 403 when deleting another user workout', async () => {
    const { data: created } = await createTestWorkout(token, 'Protected');
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workouts/${created._id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
