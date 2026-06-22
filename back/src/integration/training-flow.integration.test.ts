import { describe, expect, it } from 'vitest';
import { WorkoutSet } from '../modules/sessions/sets.model.js';
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
  getSession,
  uniqueTestName,
  updateSet,
  type Workout,
} from '../test/helpers.js';

const getApp = setupIntegrationApp();

describe('backend integration: training flow', () => {
  it('creates a workout, starts a session, manages sets, and deletes session sets', async () => {
    const app = getApp();
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
