import { describe, expect, it } from 'vitest';
import { setupIntegrationApp } from './setup.js';
import {
  authHeaders,
  createAuthenticatedUser,
  createExercise,
  createSession,
  createSet,
  createWorkout,
  expectJsonError,
  getExercises,
  getSession,
  uniqueTestName,
} from '../test/helpers.js';

const getApp = setupIntegrationApp();

describe('backend integration: ownership and reference checks', () => {
  it('blocks cross-user references and scopes set mutations to their session', async () => {
    const app = getApp();
    const owner = await createAuthenticatedUser(app, { name: 'Owner User' });
    const other = await createAuthenticatedUser(app, { name: 'Other User' });
    const ownerExercise = await createExercise(app, owner.token, {
      name: uniqueTestName('Private Owner Exercise'),
      category: 'strength',
      muscleGroup: 'Back',
    });
    const otherExercise = await createExercise(app, other.token, {
      name: uniqueTestName('Private Other Exercise'),
      category: 'strength',
      muscleGroup: 'Back',
    });

    const otherVisibleExercises = await getExercises(app, other.token);
    expect(otherVisibleExercises.map((exercise) => exercise._id)).not.toContain(ownerExercise._id);

    const forbiddenProgressRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${ownerExercise._id}/progress`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenProgressRes, 403);

    const forbiddenWorkoutCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: authHeaders(other.token),
      payload: { name: uniqueTestName('Forbidden Workout'), exercises: [ownerExercise._id] },
    });
    expectJsonError(forbiddenWorkoutCreateRes, 403);

    const ownerWorkout = await createWorkout(app, owner.token, {
      name: uniqueTestName('Owner Workout'),
      exercises: [ownerExercise._id],
    });
    const forbiddenWorkoutGetRes = await app.inject({
      method: 'GET',
      url: `/api/v1/workouts/${ownerWorkout._id}`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenWorkoutGetRes, 403);

    const forbiddenSessionCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: authHeaders(other.token),
      payload: { workoutId: ownerWorkout._id },
    });
    expectJsonError(forbiddenSessionCreateRes, 403);

    const ownerSession = await createSession(app, owner.token, ownerWorkout._id);
    const forbiddenSessionGetRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${ownerSession._id}`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenSessionGetRes, 403);

    const forbiddenSetCreateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${ownerSession._id}/sets`,
      headers: authHeaders(other.token),
      payload: { exerciseId: ownerExercise._id, reps: 5, weightKg: 100 },
    });
    expectJsonError(forbiddenSetCreateRes, 403);

    const forbiddenForeignExerciseSetRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${ownerSession._id}/sets`,
      headers: authHeaders(owner.token),
      payload: { exerciseId: otherExercise._id, reps: 5, weightKg: 100 },
    });
    expectJsonError(forbiddenForeignExerciseSetRes, 403);

    const ownerSet = await createSet(app, owner.token, ownerSession._id, {
      exerciseId: ownerExercise._id,
      reps: 8,
      weightKg: 80,
    });
    const secondOwnerSession = await createSession(app, owner.token, ownerWorkout._id);
    const wrongSessionUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/${secondOwnerSession._id}/sets/${ownerSet._id}`,
      headers: authHeaders(owner.token),
      payload: { reps: 12 },
    });
    expectJsonError(wrongSessionUpdateRes, 404);

    const unchangedSession = await getSession(app, owner.token, ownerSession._id);
    expect(unchangedSession.sets?.[0].reps).toBe(8);

    const missingWorkoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: authHeaders(owner.token),
      payload: { workoutId: '000000000000000000000001' },
    });
    expectJsonError(missingWorkoutRes, 404);

    const missingExerciseRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${ownerSession._id}/sets`,
      headers: authHeaders(owner.token),
      payload: { exerciseId: '000000000000000000000001', reps: 5, weightKg: 100 },
    });
    expectJsonError(missingExerciseRes, 404);
  });
});
