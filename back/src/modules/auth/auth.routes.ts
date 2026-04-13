import type { FastifyPluginAsync } from 'fastify';
import { loginController } from './auth.controller.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', loginController);
};
