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
  uniqueTestName,
  type CardioProgressPoint,
  type ExerciseProgress,
  type StrengthProgressPoint,
} from '../test/helpers.js';

const getApp = setupIntegrationApp();

describe('backend integration: progress flow', () => {
  it('returns chronological strength and cardio progress plus sorted all-exercise progress', async () => {
    const app = getApp();
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

  it('handles empty progress, same-session best sets, and nullable set metrics', async () => {
    const app = getApp();
    const auth = await createAuthenticatedUser(app);
    const emptyExercise = await createExercise(app, auth.token, {
      name: uniqueTestName('Empty Progress'),
      category: 'strength',
      muscleGroup: 'Chest',
    });

    const emptyAllProgressRes = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/progress',
      headers: authHeaders(auth.token),
    });
    expect(expectJsonData<ExerciseProgress[]>(emptyAllProgressRes, 200)).toEqual([]);

    const emptyExerciseProgressRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${emptyExercise._id}/progress`,
      headers: authHeaders(auth.token),
    });
    expect(expectJsonData<ExerciseProgress>(emptyExerciseProgressRes, 200).data).toEqual([]);

    const strength = await createExercise(app, auth.token, {
      name: uniqueTestName('Edge Strength Progress'),
      category: 'strength',
      muscleGroup: 'Legs',
    });
    const cardio = await createExercise(app, auth.token, {
      name: uniqueTestName('Edge Cardio Progress'),
      category: 'cardio',
      muscleGroup: 'Cardio',
    });
    const workout = await createWorkout(app, auth.token, {
      name: uniqueTestName('Edge Progress Workout'),
      exercises: [strength._id, cardio._id],
    });
    const session = await createSession(app, auth.token, workout._id, {
      date: '2026-06-22T12:00:00.000Z',
    });

    await createSet(app, auth.token, session._id, {
      exerciseId: strength._id,
      order: 0,
      reps: 1,
      weightKg: 100,
    });
    await createSet(app, auth.token, session._id, {
      exerciseId: strength._id,
      order: 1,
      reps: 5,
      weightKg: 60,
    });
    await createSet(app, auth.token, session._id, {
      exerciseId: strength._id,
      order: 2,
    });
    await createSet(app, auth.token, session._id, {
      exerciseId: cardio._id,
      order: 3,
    });

    const strengthProgressRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${strength._id}/progress`,
      headers: authHeaders(auth.token),
    });
    const strengthProgress = expectJsonData<ExerciseProgress>(strengthProgressRes, 200);
    expect(strengthProgress.data).toHaveLength(1);
    expect(strengthProgress.data[0]).toMatchObject({
      maxWeight: 100,
      reps: 1,
      estimated1RM: 100,
    });

    const cardioProgressRes = await app.inject({
      method: 'GET',
      url: `/api/v1/exercises/${cardio._id}/progress`,
      headers: authHeaders(auth.token),
    });
    const cardioProgress = expectJsonData<ExerciseProgress>(cardioProgressRes, 200);
    expect(cardioProgress.data[0]).toMatchObject({ maxDuration: 0, restSecs: null });
  });
});
