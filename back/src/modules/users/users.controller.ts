import type { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { createUserBodySchema, userIdParamsSchema } from './users.schema.js';
import { createUser, findUserById, listUsers } from './users.service.js';

// returns all users
export async function getUsersController(_request: FastifyRequest, reply: FastifyReply) {
  const users = await listUsers();
  return reply.status(200).send({ data: users });
}

// validates input and creates a new user
export async function createUserController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = createUserBodySchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.status(400).send({
      error: 'Validation error',
      details: parsedBody.error.format(),
    });
  }

  try {
    const createdUser = await createUser(parsedBody.data);
    return reply.status(201).send({ data: createdUser });
  } catch (error: any) {
    if (error.code === 11000) {
      return reply.status(409).send({ error: 'E-mail already registered' });
    }

    throw error;
  }
}

// validates id and returns a single user
export async function getUserByIdController(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = userIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    return reply.status(400).send({
      error: 'Validation error',
      details: parsedParams.error.format(),
    });
  }

  const user = await findUserById(parsedParams.data.id);

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.status(200).send({ data: user });
}
