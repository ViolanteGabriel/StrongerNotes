import fastify from 'fastify';
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
