import fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { usersRoutes } from './modules/users/users.routes.js';

export const app = fastify({
  logger: true,
});

app.register(cors, {
  origin: true, // In production, replace with specific domain
});

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.register(usersRoutes, { prefix: '/api/v1/users' });

// global error handler
app.setErrorHandler((error: FastifyError, request, reply) => {
  const status = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  reply.status(status).send({
    error: message,
    statusCode: status,
  });
});
