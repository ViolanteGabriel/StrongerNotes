import type { FastifyReply, FastifyRequest } from 'fastify';
import { createExerciseBodySchema, exerciseIdParamsSchema } from './exercises.schema.js';
import {
  listExercises,
  createExercise,
  getExerciseProgress,
  getAllExercisesProgress,
  findExerciseById,
  canAccessExercise,
} from './exercises.service.js';

export async function getExercisesController(request: FastifyRequest, reply: FastifyReply) {
  const exercises = await listExercises(request.user.sub);
  return reply.status(200).send({ data: exercises });
}

export async function createExerciseController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createExerciseBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const exercise = await createExercise(parsed.data, request.user.sub);
  return reply.status(201).send({ data: exercise });
}

export async function getAllExercisesProgressController(request: FastifyRequest, reply: FastifyReply) {
  const result = await getAllExercisesProgress(request.user.sub);
  return reply.status(200).send({ data: result });
}

export async function getExerciseProgressController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = exerciseIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const exercise = await findExerciseById(parsed.data.id);
  if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });

  if (!canAccessExercise(exercise, request.user.sub)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const result = await getExerciseProgress(parsed.data.id, request.user.sub);
  if (!result) return reply.status(404).send({ error: 'Exercise not found' });

  return reply.status(200).send({ data: result });
}
