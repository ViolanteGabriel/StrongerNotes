import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  createSessionBodySchema,
  sessionIdParamsSchema,
  createSetBodySchema,
  updateSetBodySchema,
  setIdParamsSchema,
} from './sessions.schema.js';
import {
  listSessions,
  createSession,
  findSessionById,
  deleteSession,
  listSetsBySession,
  createSet,
  updateSet,
  deleteSet,
} from './sessions.service.js';
import { findWorkoutById } from '../workouts/workouts.service.js';
import { canAccessExercise, findExerciseById } from '../exercises/exercises.service.js';

export async function getSessionsController(request: FastifyRequest, reply: FastifyReply) {
  const sessions = await listSessions(request.user.sub);
  return reply.status(200).send({ data: sessions });
}

export async function createSessionController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createSessionBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const workout = await findWorkoutById(parsed.data.workoutId);
  if (!workout) return reply.status(404).send({ error: 'Workout not found' });

  if (workout.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const session = await createSession(parsed.data, request.user.sub);
  return reply.status(201).send({ data: session });
}

export async function getSessionByIdController(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = sessionIdParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedParams.error.format() });
  }

  const session = await findSessionById(parsedParams.data.id);
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  if (session.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const sets = await listSetsBySession(parsedParams.data.id);
  return reply.status(200).send({ data: { ...session, sets } });
}

export async function deleteSessionController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = sessionIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const session = await findSessionById(parsed.data.id);
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  if (session.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  await deleteSession(parsed.data.id);
  return reply.status(204).send();
}

export async function createSetController(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = sessionIdParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedParams.error.format() });
  }

  const parsedBody = createSetBodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedBody.error.format() });
  }

  const session = await findSessionById(parsedParams.data.id);
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  if (session.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const exercise = await findExerciseById(parsedBody.data.exerciseId);
  if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });

  if (!canAccessExercise(exercise, request.user.sub)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const set = await createSet(parsedParams.data.id, parsedBody.data);
  return reply.status(201).send({ data: set });
}

export async function updateSetController(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = setIdParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedParams.error.format() });
  }

  const parsedBody = updateSetBodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsedBody.error.format() });
  }

  const session = await findSessionById(parsedParams.data.id);
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  if (session.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const updated = await updateSet(parsedParams.data.id, parsedParams.data.setId, parsedBody.data);
  if (!updated) return reply.status(404).send({ error: 'Set not found' });

  return reply.status(200).send({ data: updated });
}

export async function deleteSetController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = setIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation error', details: parsed.error.format() });
  }

  const session = await findSessionById(parsed.data.id);
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  if (session.owner.toString() !== request.user.sub) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const deleted = await deleteSet(parsed.data.id, parsed.data.setId);
  if (!deleted) return reply.status(404).send({ error: 'Set not found' });

  return reply.status(204).send();
}
