import { afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../test/helpers.js';

export function setupIntegrationApp() {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  return () => app;
}
