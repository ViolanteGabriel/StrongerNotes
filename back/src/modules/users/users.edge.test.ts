import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, createTestUser, loginTestUser } from '../../test/helpers.js';

// Testes de integração que cobrem comportamentos reais ainda não exercitados do users.service: buscar o próprio perfil e usar um token de usuário já removido.
let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/v1/users/me', () => {
  it('retorna o próprio perfil do usuário autenticado', async () => {
    await createTestUser(app, { name: 'Mia', email: 'mia@example.com', password: 'password123' });
    const { data: auth } = await loginTestUser(app, 'mia@example.com', 'password123');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: { email: string } }>().data.email).toBe('mia@example.com');
  });
});

describe('token de um usuário que não existe mais', () => {
  it('PUT devolve 404 ao atualizar um usuário já deletado (token ainda válido)', async () => {
    const { data: user } = await createTestUser(app, { name: 'Tom', email: 'tom@example.com', password: 'password123' });
    const { data: auth } = await loginTestUser(app, 'tom@example.com', 'password123');

    // o usuário deleta a própria conta
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${user._id}`,
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    // tenta atualizar com o token antigo -> updateUser não encontra -> 404
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${user._id}`,
      headers: { Authorization: `Bearer ${auth.token}` },
      payload: { name: 'Novo Nome' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('DELETE devolve 404 ao deletar um usuário já deletado (token ainda válido)', async () => {
    const { data: user } = await createTestUser(app, { name: 'Rex', email: 'rex@example.com', password: 'password123' });
    const { data: auth } = await loginTestUser(app, 'rex@example.com', 'password123');

    await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${user._id}`,
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    // segunda tentativa de delete -> deleteUser não encontra -> 404
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${user._id}`,
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
