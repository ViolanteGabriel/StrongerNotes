import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  createWorkoutBodySchema,
  updateWorkoutBodySchema,
  workoutIdParamsSchema,
} from './workouts.schema.js';
import {
  listWorkouts,
  createWorkout,
  findWorkoutById,
  updateWorkout,
  deleteWorkout,
} from './workouts.service.js';
import { canAccessExercise, findExerciseById } from '../exercises/exercises.service.js';

async function getExerciseReferenceError(exerciseIds: string[], userId: string) {
  for (const exerciseId of new Set(exerciseIds)) {
    const exercise = await findExerciseById(exerciseId);
    if (!exercise) return { statusCode: 404, error: 'Exercise not found' };
    if (!canAccessExercise(exercise, userId)) return { statusCode: 403, error: 'Forbidden' };
  }

  return null;
}

export async function getWorkoutsController(request: FastifyRequest, reply: FastifyReply) {
  const workouts = await listWorkouts(request.user.sub);
  return reply.status(200).send({ data: workouts });
}

export async function createWorkoutController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createWorkoutBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const referenceError = await getExerciseReferenceError(parsed.data.exercises, request.user.sub);
  if (referenceError) {
    return reply.status(referenceError.statusCode).send({ error: referenceError.error });
  }

  const workout = await createWorkout(parsed.data, request.user.sub);
  return reply.status(201).send({ data: workout });
}

export async function getWorkoutByIdController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = workoutIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const workout = await findWorkoutById(parsed.data.id);
  if (!workout) return reply.status(404).send({ error: 'Workout not found' });

  if (workout.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  return reply.status(200).send({ data: workout });
}

export async function updateWorkoutController(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = workoutIdParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedParams.error.format() });
  }

  const parsedBody = updateWorkoutBodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedBody.error.format() });
  }

  const workout = await findWorkoutById(parsedParams.data.id);
  if (!workout) return reply.status(404).send({ error: 'Workout not found' });

  if (workout.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  if (parsedBody.data.exercises) {
    const referenceError = await getExerciseReferenceError(parsedBody.data.exercises, request.user.sub);
    if (referenceError) {
      return reply.status(referenceError.statusCode).send({ error: referenceError.error });
    }
  }

  const updated = await updateWorkout(parsedParams.data.id, parsedBody.data);
  return reply.status(200).send({ data: updated });
}

export async function deleteWorkoutController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = workoutIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const workout = await findWorkoutById(parsed.data.id);
  if (!workout) return reply.status(404).send({ error: 'Workout not found' });

  if (workout.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  await deleteWorkout(parsed.data.id);
  return reply.status(204).send();
}
