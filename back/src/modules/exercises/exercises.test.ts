import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, createTestUser, loginTestUser } from '../../test/helpers.js';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await createTestApp();
});

beforeEach(async () => {
  await createTestUser(app);
  const res = await loginTestUser(app, 'test@example.com', 'password123');
  token = res.data.token;
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/v1/exercises', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/exercises' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with array when authenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: unknown[] }>().data).toBeInstanceOf(Array);
  });
});

describe('POST /api/v1/exercises', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      payload: { name: 'Cable Fly', category: 'strength', muscleGroup: 'Chest' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('creates a custom exercise and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Cable Fly', category: 'strength', muscleGroup: 'Chest' },
    });
    expect(res.statusCode).toBe(201);
    const { data } = res.json<{ data: Record<string, unknown> }>();
    expect(data.name).toBe('Cable Fly');
    expect(data.isCustom).toBe(true);
    expect(data).toHaveProperty('_id');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Cable Fly' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid category', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Cable Fly', category: 'yoga', muscleGroup: 'Chest' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/exercises/:id/progress', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/000000000000000000000001/progress',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 for non-existent exercise', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/000000000000000000000001/progress',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for invalid ObjectId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/not-an-id/progress',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns progress data with empty array when no sets logged', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Progress Test', category: 'strength', muscleGroup: 'Chest' },
    });
    const exerciseId = createRes.json<{ data: { _id: string } }>().data._id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${exerciseId}/progress`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{ data: { exercise: unknown; data: unknown[] } }>();
    expect(data).toHaveProperty('exercise');
    expect(data.data).toBeInstanceOf(Array);
    expect(data.data).toHaveLength(0);
  });

  it('returns progress data points after logging sets', async () => {
    const exerciseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Bench Press Test', category: 'strength', muscleGroup: 'Chest' },
    });
    const exerciseId = exerciseRes.json<{ data: { _id: string } }>().data._id;

    const workoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Test Workout' },
    });
    const workoutId = workoutRes.json<{ data: { _id: string } }>().data._id;

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: { Authorization: `Bearer ${token}` },
      payload: { workoutId },
    });
    const sessionId = sessionRes.json<{ data: { _id: string } }>().data._id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId, reps: 5, weightKg: 100, order: 0 },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId, reps: 8, weightKg: 80, order: 1 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${exerciseId}/progress`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{ data: { exercise: unknown; data: { maxWeight: number; reps: number; estimated1RM: number }[] } }>();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].maxWeight).toBe(100);
    expect(data.data[0].reps).toBe(5);
    expect(data.data[0].estimated1RM).toBeGreaterThan(100);
  });
});

describe('GET /api/v1/exercises/progress', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/exercises/progress' });
    expect(res.statusCode).toBe(401);
  });

  it('returns empty array when no sessions logged', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/progress',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{ data: unknown[] }>();
    expect(data).toBeInstanceOf(Array);
    expect(data).toHaveLength(0);
  });

  it('returns progress entries for every exercise with logged sets', async () => {
    const benchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Multi Bench', category: 'strength', muscleGroup: 'Chest' },
    });
    const benchId = benchRes.json<{ data: { _id: string } }>().data._id;

    const squatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Multi Squat', category: 'strength', muscleGroup: 'Quadriceps' },
    });
    const squatId = squatRes.json<{ data: { _id: string } }>().data._id;

    const workoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Multi Workout' },
    });
    const workoutId = workoutRes.json<{ data: { _id: string } }>().data._id;

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: { Authorization: `Bearer ${token}` },
      payload: { workoutId },
    });
    const sessionId = sessionRes.json<{ data: { _id: string } }>().data._id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId: benchId, reps: 5, weightKg: 100, order: 0 },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/sets`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { exerciseId: squatId, reps: 3, weightKg: 140, order: 1 },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/progress',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{
      data: { exercise: { _id: string; name: string }; data: { estimated1RM: number }[] }[];
    }>();
    const ids = data.map((entry) => entry.exercise._id);
    expect(ids).toContain(benchId);
    expect(ids).toContain(squatId);
    const benchEntry = data.find((entry) => entry.exercise._id === benchId)!;
    expect(benchEntry.data).toHaveLength(1);
    expect(benchEntry.data[0].estimated1RM).toBeGreaterThan(100);
  });
});
