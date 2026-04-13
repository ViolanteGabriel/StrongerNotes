import fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './env/index.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';

export const app = fastify({
  logger: true,
});

app.register(cors, {
  origin: true, // In production, replace with specific domain
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.register(usersRoutes, { prefix: '/api/v1/users' });
app.register(authRoutes, { prefix: '/api/v1/auth' });

// global error handler
app.setErrorHandler((error: FastifyError, request, reply) => {
  const status = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  reply.status(status).send({
    error: message,
    statusCode: status,
  });
});
