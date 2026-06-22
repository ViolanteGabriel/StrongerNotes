import { describe, expect, it } from 'vitest';
import { setupIntegrationApp } from './setup.js';
import {
  authHeaders,
  createAuthenticatedUser,
  createExercise,
  createSession,
  createSet,
  createWorkout,
  expectJsonData,
  expectJsonError,
  uniqueTestEmail,
  uniqueTestName,
  type AuthUser,
  type Workout,
} from '../test/helpers.js';

const getApp = setupIntegrationApp();

describe('backend integration: validation and missing resources', () => {
  it('returns consistent auth, validation, not found, and forbidden errors', async () => {
    const app = getApp();
    const missingAuthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
    });
    expectJsonError(missingAuthRes, 401);

    const invalidRegisterRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: '', email: 'not-an-email', password: 'short' },
    });
    expectJsonError(invalidRegisterRes, 400);

    const invalidLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'not-an-email', password: '' },
    });
    expectJsonError(invalidLoginRes, 400);

    const auth = await createAuthenticatedUser(app);
    const other = await createAuthenticatedUser(app);

    const duplicateCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: 'Duplicate User', email: auth.email, password: auth.password },
    });
    expectJsonError(duplicateCreateRes, 409);

    const wrongPasswordRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: auth.email, password: 'wrong-password' },
    });
    expectJsonError(wrongPasswordRes, 401);

    const missingEmailRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: uniqueTestEmail('missing'), password: auth.password },
    });
    expectJsonError(missingEmailRes, 401);

    const usersRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: authHeaders(auth.token),
    });
    const users = expectJsonData<AuthUser[]>(usersRes, 200);
    expect(users.map((user) => user.email)).toEqual(expect.arrayContaining([auth.email, other.email]));

    const invalidUserIdRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidUserIdRes, 400);

    const missingUserRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/000000000000000000000001',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingUserRes, 404);

    const forbiddenUpdateUserRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${other.user._id}`,
      headers: authHeaders(auth.token),
      payload: { name: 'Nope' },
    });
    expectJsonError(forbiddenUpdateUserRes, 403);

    const invalidUpdateUserIdRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/not-an-id',
      headers: authHeaders(auth.token),
      payload: { name: 'Nope' },
    });
    expectJsonError(invalidUpdateUserIdRes, 400);

    const emptyUpdateUserRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(auth.token),
      payload: {},
    });
    expectJsonError(emptyUpdateUserRes, 400);

    const invalidDeleteUserIdRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidDeleteUserIdRes, 400);

    const forbiddenDeleteUserRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${other.user._id}`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(forbiddenDeleteUserRes, 403);

    const invalidExerciseCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/exercises',
      headers: authHeaders(auth.token),
      payload: { name: '', category: 'invalid', muscleGroup: '' },
    });
    expectJsonError(invalidExerciseCreateRes, 400);

    const missingProgressRes = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/000000000000000000000001/progress',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingProgressRes, 404);

    const invalidProgressRes = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/not-an-id/progress',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidProgressRes, 400);

    const exercise = await createExercise(app, auth.token);
    const otherExercise = await createExercise(app, other.token);
    const workout = await createWorkout(app, auth.token, {
      exercises: [exercise._id],
    });

    const workoutsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts',
      headers: authHeaders(auth.token),
    });
    const workouts = expectJsonData<Workout[]>(workoutsRes, 200);
    expect(workouts.map((entry) => entry._id)).toContain(workout._id);

    const invalidWorkoutCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: authHeaders(auth.token),
      payload: { name: '', exercises: ['not-an-id'] },
    });
    expectJsonError(invalidWorkoutCreateRes, 400);

    const missingWorkoutExerciseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/workouts',
      headers: authHeaders(auth.token),
      payload: { name: uniqueTestName('Missing Exercise Workout'), exercises: ['000000000000000000000001'] },
    });
    expectJsonError(missingWorkoutExerciseRes, 404);

    const invalidWorkoutGetRes = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidWorkoutGetRes, 400);

    const missingWorkoutGetRes = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts/000000000000000000000001',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingWorkoutGetRes, 404);

    const invalidWorkoutUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(auth.token),
      payload: {},
    });
    expectJsonError(invalidWorkoutUpdateRes, 400);

    const forbiddenWorkoutUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(other.token),
      payload: { name: 'Forbidden' },
    });
    expectJsonError(forbiddenWorkoutUpdateRes, 403);

    const missingWorkoutUpdateRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/workouts/000000000000000000000001',
      headers: authHeaders(auth.token),
      payload: { name: 'Missing Workout' },
    });
    expectJsonError(missingWorkoutUpdateRes, 404);

    const forbiddenWorkoutExerciseUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(auth.token),
      payload: { exercises: [otherExercise._id] },
    });
    expectJsonError(forbiddenWorkoutExerciseUpdateRes, 403);

    const updatedWorkoutRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(auth.token),
      payload: { name: 'Updated Workout Name' },
    });
    const updatedWorkout = expectJsonData<Workout>(updatedWorkoutRes, 200);
    expect(updatedWorkout.name).toBe('Updated Workout Name');

    const invalidWorkoutDeleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/workouts/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidWorkoutDeleteRes, 400);

    const missingWorkoutDeleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/workouts/000000000000000000000001',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingWorkoutDeleteRes, 404);

    const forbiddenWorkoutDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenWorkoutDeleteRes, 403);

    const invalidSessionCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: authHeaders(auth.token),
      payload: { workoutId: 'not-an-id', notes: 'x'.repeat(501) },
    });
    expectJsonError(invalidSessionCreateRes, 400);

    const session = await createSession(app, auth.token, workout._id);

    const sessionsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sessions',
      headers: authHeaders(auth.token),
    });
    const sessions = expectJsonData<{ _id: string }[]>(sessionsRes, 200);
    expect(sessions.map((entry) => entry._id)).toContain(session._id);

    const invalidSessionGetRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sessions/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidSessionGetRes, 400);

    const missingSessionGetRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sessions/000000000000000000000001',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingSessionGetRes, 404);

    const invalidSessionDeleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/sessions/not-an-id',
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidSessionDeleteRes, 400);

    const missingSessionDeleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/sessions/000000000000000000000001',
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingSessionDeleteRes, 404);

    const forbiddenSessionDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenSessionDeleteRes, 403);

    const invalidSetCreateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${session._id}/sets`,
      headers: authHeaders(auth.token),
      payload: { exerciseId: 'not-an-id', reps: -1 },
    });
    expectJsonError(invalidSetCreateRes, 400);

    const missingSetSessionCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions/000000000000000000000001/sets',
      headers: authHeaders(auth.token),
      payload: { exerciseId: exercise._id, reps: 10 },
    });
    expectJsonError(missingSetSessionCreateRes, 404);

    const set = await createSet(app, auth.token, session._id, {
      exerciseId: exercise._id,
      reps: 10,
      weightKg: 50,
    });

    const invalidSetUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/${session._id}/sets/${set._id}`,
      headers: authHeaders(auth.token),
      payload: {},
    });
    expectJsonError(invalidSetUpdateRes, 400);

    const invalidSetUpdateParamsRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/not-an-id/sets/${set._id}`,
      headers: authHeaders(auth.token),
      payload: { reps: 11 },
    });
    expectJsonError(invalidSetUpdateParamsRes, 400);

    const missingSetSessionUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/000000000000000000000001/sets/${set._id}`,
      headers: authHeaders(auth.token),
      payload: { reps: 11 },
    });
    expectJsonError(missingSetSessionUpdateRes, 404);

    const forbiddenSetUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/${session._id}/sets/${set._id}`,
      headers: authHeaders(other.token),
      payload: { reps: 11 },
    });
    expectJsonError(forbiddenSetUpdateRes, 403);

    const missingSetUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/sessions/${session._id}/sets/000000000000000000000001`,
      headers: authHeaders(auth.token),
      payload: { reps: 11 },
    });
    expectJsonError(missingSetUpdateRes, 404);

    const invalidSetDeleteParamsRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}/sets/not-an-id`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(invalidSetDeleteParamsRes, 400);

    const missingSetSessionDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/000000000000000000000001/sets/${set._id}`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingSetSessionDeleteRes, 404);

    const forbiddenSetDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}/sets/${set._id}`,
      headers: authHeaders(other.token),
    });
    expectJsonError(forbiddenSetDeleteRes, 403);

    const missingSetDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}/sets/000000000000000000000001`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(missingSetDeleteRes, 404);

    const deletedWorkoutRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(auth.token),
    });
    expect(deletedWorkoutRes.statusCode).toBe(204);

    const secondDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(auth.token),
    });
    expect(secondDeleteRes.statusCode).toBe(204);

    const deletedMeRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: authHeaders(auth.token),
    });
    expectJsonError(deletedMeRes, 404);

    const deletedAgainRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(deletedAgainRes, 404);
  });
});
