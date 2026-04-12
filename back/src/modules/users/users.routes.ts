import type { FastifyPluginAsync } from 'fastify';
import { createUserController, getUserByIdController, getUsersController } from './users.controller.js';

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', getUsersController);
  app.post('/', createUserController);
  app.get('/:id', getUserByIdController);
};
