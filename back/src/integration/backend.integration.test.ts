import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { WorkoutSet } from '../modules/sessions/sets.model.js';
import {
  authHeaders,
  createAuthenticatedUser,
  createExercise,
  createSession,
  createSet,
  createTestApp,
  createWorkout,
  expectJsonData,
  expectJsonError,
  getExercises,
  getSession,
  uniqueTestEmail,
  uniqueTestName,
  updateSet,
  type AuthUser,
  type CardioProgressPoint,
  type ExerciseProgress,
  type StrengthProgressPoint,
  type Workout,
} from '../test/helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe('backend integration: account lifecycle', () => {
  it('registers, authenticates, updates, rejects email conflicts, and deletes an account', async () => {
    const auth = await createAuthenticatedUser(app, { name: 'Lifecycle User' });

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: authHeaders(auth.token),
    });
    const me = expectJsonData<AuthUser>(meRes, 200);
    expect(me._id).toBe(auth.user._id);
    expect(me.email).toBe(auth.email);

    const updatedEmail = uniqueTestEmail('lifecycle-updated');
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(auth.token),
      payload: { name: 'Lifecycle Updated', email: updatedEmail },
    });
    const updated = expectJsonData<AuthUser & { passwordHash?: string }>(updateRes, 200);
    expect(updated.name).toBe('Lifecycle Updated');
    expect(updated.email).toBe(updatedEmail);
    expect(updated.passwordHash).toBeUndefined();

    const refreshedLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: updatedEmail, password: auth.password },
    });
    const refreshed = expectJsonData<{ token: string; user: AuthUser }>(refreshedLoginRes, 200);
    expect(refreshed.user.name).toBe('Lifecycle Updated');

    const taken = await createAuthenticatedUser(app);
    const conflictRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(refreshed.token),
      payload: { email: taken.email },
    });
    expectJsonError(conflictRes, 409);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${auth.user._id}`,
      headers: authHeaders(refreshed.token),
    });
    expect(deleteRes.statusCode).toBe(204);

    const deletedLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: updatedEmail, password: auth.password },
    });
    expectJsonError(deletedLoginRes, 401);
  });
});

describe('backend integration: training flow', () => {
  it('creates a workout, starts a session, manages sets, and deletes session sets', async () => {
    const auth = await createAuthenticatedUser(app);
    const strength = await createExercise(app, auth.token, {
      name: uniqueTestName('Bench Integration'),
      category: 'strength',
      muscleGroup: 'Chest',
    });
    const cardio = await createExercise(app, auth.token, {
      name: uniqueTestName('Run Integration'),
      category: 'cardio',
      muscleGroup: 'Cardio',
    });

    const workout = await createWorkout(app, auth.token, {
      name: uniqueTestName('Full Session'),
      exercises: [strength._id, cardio._id],
    });

    const workoutRes = await app.inject({
      method: 'GET',
      url: `/api/v1/workouts/${workout._id}`,
      headers: authHeaders(auth.token),
    });
    const fetchedWorkout = expectJsonData<Workout>(workoutRes, 200);
    const fetchedExerciseNames = fetchedWorkout.exercises.map((exercise) => (
      typeof exercise === 'string' ? exercise : exercise.name
    ));
    expect(fetchedExerciseNames).toEqual([strength.name, cardio.name]);

    const session = await createSession(app, auth.token, workout._id, {
      notes: 'Integration session',
    });
    const strengthSet = await createSet(app, auth.token, session._id, {
      exerciseId: strength._id,
      order: 1,
      reps: 5,
      weightKg: 100,
      restSecs: 120,
    });
    const cardioSet = await createSet(app, auth.token, session._id, {
      exerciseId: cardio._id,
      order: 0,
      durationSecs: 600,
      restSecs: 90,
    });

    const populated = await getSession(app, auth.token, session._id);
    expect(typeof populated.workout).toBe('object');
    expect(populated.sets?.map((set) => set.exercise.name)).toEqual([cardio.name, strength.name]);

    const updatedSet = await updateSet(app, auth.token, session._id, strengthSet._id, {
      reps: 6,
      weightKg: 105,
      notes: 'PR',
    });
    expect(updatedSet.reps).toBe(6);
    expect(updatedSet.weightKg).toBe(105);
    expect(updatedSet.notes).toBe('PR');

    const deleteSetRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}/sets/${cardioSet._id}`,
      headers: authHeaders(auth.token),
    });
    expect(deleteSetRes.statusCode).toBe(204);

    const afterSetDelete = await getSession(app, auth.token, session._id);
    expect(afterSetDelete.sets?.map((set) => set._id)).toEqual([strengthSet._id]);

    const deleteSessionRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${session._id}`,
      headers: authHeaders(auth.token),
    });
    expect(deleteSessionRes.statusCode).toBe(204);

    const deletedSessionRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${session._id}`,
      headers: authHeaders(auth.token),
    });
    expectJsonError(deletedSessionRes, 404);
    await expect(WorkoutSet.countDocuments({ session: session._id })).resolves.toBe(0);
  });
});

describe('backend integration: progress flow', () => {
  it('returns chronological strength and cardio progress plus sorted all-exercise progress', async () => {
    const auth = await createAuthenticatedUser(app);
    const cardio = await createExercise(app, auth.token, {
      name: uniqueTestName('A Cardio Progress'),
      category: 'cardio',
      muscleGroup: 'Cardio',
    });
    const strength = await createExercise(app, auth.token, {
      name: uniqueTestName('Z Strength Progress'),
      category: 'strength',
      muscleGroup: 'Chest',
    });
    const workout = await createWorkout(app, auth.token, {
      name: uniqueTestName('Progress Workout'),
      exercises: [cardio._id, strength._id],
    });

    const laterSession = await createSession(app, auth.token, workout._id, {
      date: '2026-06-21T12:00:00.000Z',
    });
    const earlierSession = await createSession(app, auth.token, workout._id, {
      date: '2026-06-20T12:00:00.000Z',
    });

    await createSet(app, auth.token, laterSession._id, {
      exerciseId: strength._id,
      order: 0,
      reps: 5,
      weightKg: 100,
    });
    await createSet(app, auth.token, earlierSession._id, {
      exerciseId: strength._id,
      order: 0,
      reps: 3,
      weightKg: 110,
    });
    await createSet(app, auth.token, laterSession._id, {
      exerciseId: cardio._id,
      order: 1,
      durationSecs: 600,
      restSecs: 90,
    });
    await createSet(app, auth.token, earlierSession._id, {
      exerciseId: cardio._id,
      order: 1,
      durationSecs: 900,
      restSecs: 120,
    });

    const strengthRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${strength._id}/progress`,
      headers: authHeaders(auth.token),
    });
    const strengthProgress = expectJsonData<ExerciseProgress>(strengthRes, 200);
    const strengthData = strengthProgress.data as StrengthProgressPoint[];
    expect(strengthData.map((point) => point.date)).toEqual([
      '2026-06-20T12:00:00.000Z',
      '2026-06-21T12:00:00.000Z',
    ]);
    expect(strengthData[0]).toMatchObject({ maxWeight: 110, reps: 3, estimated1RM: 121 });
    expect(strengthData[1]).toMatchObject({ maxWeight: 100, reps: 5, estimated1RM: 116.7 });

    const cardioRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${cardio._id}/progress`,
      headers: authHeaders(auth.token),
    });
    const cardioProgress = expectJsonData<ExerciseProgress>(cardioRes, 200);
    const cardioData = cardioProgress.data as CardioProgressPoint[];
    expect(cardioData.map((point) => point.maxDuration)).toEqual([900, 600]);
    expect(cardioData.map((point) => point.restSecs)).toEqual([120, 90]);

    const allProgressRes = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/progress',
      headers: authHeaders(auth.token),
    });
    const allProgress = expectJsonData<ExerciseProgress[]>(allProgressRes, 200);
    expect(allProgress.map((entry) => entry.exercise.name)).toEqual([cardio.name, strength.name]);
  });
});

describe('backend integration: ownership and reference checks', () => {
  it('blocks cross-user references and scopes set mutations to their session', async () => {
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
