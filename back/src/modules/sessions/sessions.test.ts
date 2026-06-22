import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, createTestUser, loginTestUser } from '../../test/helpers.js';

let app: FastifyInstance;
let token: string;
let otherToken: string;
let workoutId: string;
let exerciseId: string;

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

  const workoutRes = await app.inject({
    method: 'POST',
    url: '/api/v1/workouts',
    headers: { Authorization: `Bearer ${token}` },
    payload: { name: 'Test Workout' },
  });
  workoutId = workoutRes.json<{ data: { _id: string } }>().data._id;

  const exerciseRes = await app.inject({
    method: 'POST',
    url: '/api/v1/exercises',
    headers: { Authorization: `Bearer ${token}` },
    payload: { name: 'Test Exercise', category: 'strength', muscleGroup: 'Chest' },
  });
  exerciseId = exerciseRes.json<{ data: { _id: string } }>().data._id;
});

afterAll(async () => {
  await app.close();
});

async function createTestSession(t: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/sessions',
    headers: { Authorization: `Bearer ${t}` },
    payload: { workoutId },
  });
  return res.json<{ data: { _id: string } }>();
}

describe('POST /api/v1/sessions', () => {
  it('creates a session and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: { Authorization: `Bearer ${token}` },
      payload: { workoutId },
    });
    expect(res.statusCode).toBe(201);
    const { data } = res.json<{ data: Record<string, unknown> }>();
    expect(data).toHaveProperty('_id');
    expect(data.workout).toBe(workoutId);
  });

  it('returns 400 for invalid workoutId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: { Authorization: `Bearer ${token}` },
      payload: { workoutId: 'not-an-id' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { workoutId },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/sessions', () => {
  it('returns 200 with array when authenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sessions',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: unknown[] }>().data).toBeInstanceOf(Array);
  });
});

describe('GET /api/v1/sessions/:id', () => {
  it('returns session with sets array', async () => {
    const { data: created } = await createTestSession(token);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${created._id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{ data: Record<string, unknown> }>();
    expect(data).toHaveProperty('sets');
    expect(data.sets).toBeInstanceOf(Array);
  });

  it('returns 403 when accessing another user session', async () => {
    const { data: created } = await createTestSession(token);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${created._id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/v1/sessions/:id/sets', () => {
  it('adds a set and returns 201', async () => {
    const { data: session } = await createTestSession(token);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${session._id}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId, reps: 10, weightKg: 80, order: 0 },
    });
    expect(res.statusCode).toBe(201);
    const { data } = res.json<{ data: Record<string, unknown> }>();
    expect(data.reps).toBe(10);
    expect(data.weightKg).toBe(80);
  });

  it('returns 400 for missing exerciseId', async () => {
    const { data: session } = await createTestSession(token);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${session._id}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { reps: 10 },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/v1/sessions/:id/sets/:setId', () => {
  it('updates a set and returns 200', async () => {
    const { data: session } = await createTestSession(token);
    const setRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${session._id}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId, reps: 8, weightKg: 60, order: 0 },
    });
    const setId = setRes.json<{ data: { _id: string } }>().data._id;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/${session._id}/sets/${setId}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { reps: 12, weightKg: 65 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: { reps: number } }>().data.reps).toBe(12);
  });
});

describe('DELETE /api/v1/sessions/:id/sets/:setId', () => {
  it('deletes a set and returns 204', async () => {
    const { data: session } = await createTestSession(token);
    const setRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${session._id}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId, reps: 5, order: 0 },
    });
    const setId = setRes.json<{ data: { _id: string } }>().data._id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}/sets/${setId}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});

describe('DELETE /api/v1/sessions/:id', () => {
  it('deletes own session and returns 204', async () => {
    const { data: created } = await createTestSession(token);
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${created._id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 403 when deleting another user session', async () => {
    const { data: created } = await createTestSession(token);
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${created._id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
