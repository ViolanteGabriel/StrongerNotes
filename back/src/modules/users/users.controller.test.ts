import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyReply } from 'fastify';

// Mockamos o service de usuários: assim controlamos o "banco" e forçamos os caminhos de erro (404, 409, exceção genérica) sem subir API nem MongoDB.
vi.mock('./users.service.js', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import {
  createUserController,
  getMeController,
  updateUserController,
  deleteUserController,
} from './users.controller.js';
import { createUser, findUserByEmail, updateUser, deleteUser } from './users.service.js';

function mockReply() {
  const reply = {} as Record<string, ReturnType<typeof vi.fn>>;
  reply.status = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as unknown as FastifyReply;
}

const ID_A = 'a'.repeat(24);
const ID_B = 'b'.repeat(24);

beforeEach(() => vi.clearAllMocks());

describe('createUserController', () => {
  it('responde 400 quando o corpo é inválido', async () => {
    const request = { body: { name: '' } } as never;
    const reply = mockReply();
    await createUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 409 quando o e-mail já existe (erro 11000 do Mongo)', async () => {
    // simulamos o banco lançando o erro de chave duplicada
    vi.mocked(createUser).mockRejectedValue({ code: 11000 } as never);
    const request = { body: { name: 'Ana', email: 'ana@x.com', password: 'senha12345' } } as never;
    const reply = mockReply();
    await createUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(409);
  });

  it('repassa o erro quando é uma falha genérica (não 11000)', async () => {
    vi.mocked(createUser).mockRejectedValue(new Error('banco fora do ar'));
    const request = { body: { name: 'Ana', email: 'ana@x.com', password: 'senha12345' } } as never;
    const reply = mockReply();
    // o controller deve relançar o erro (não tratar como 409)
    await expect(createUserController(request, reply)).rejects.toThrow('banco fora do ar');
  });
});

describe('getMeController', () => {
  it('responde 404 quando o usuário do token não existe mais', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    const request = { user: { email: 'sumiu@x.com' } } as never;
    const reply = mockReply();
    await getMeController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it('responde 200 com o usuário quando ele existe', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ _id: ID_A, email: 'ana@x.com' } as never);
    const request = { user: { email: 'ana@x.com' } } as never;
    const reply = mockReply();
    await getMeController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});

describe('updateUserController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, body: { name: 'X' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await updateUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('repassa um erro genérico (não 11000) ao atualizar', async () => {
    vi.mocked(updateUser).mockRejectedValue(new Error('banco fora do ar'));
    const request = { params: { id: ID_A }, body: { name: 'X' }, user: { sub: ID_A } } as never;
    const reply = mockReply();
    await expect(updateUserController(request, reply)).rejects.toThrow('banco fora do ar');
  });

  it('responde 403 quando tenta editar outro usuário', async () => {
    const request = { params: { id: ID_A }, body: { name: 'X' }, user: { sub: ID_B } } as never;
    const reply = mockReply();
    await updateUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('responde 404 quando o usuário a atualizar não é encontrado', async () => {
    vi.mocked(updateUser).mockResolvedValue(null);
    const request = { params: { id: ID_A }, body: { name: 'X' }, user: { sub: ID_A } } as never;
    const reply = mockReply();
    await updateUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it('responde 409 quando o novo e-mail já está em uso (erro 11000)', async () => {
    vi.mocked(updateUser).mockRejectedValue({ code: 11000 } as never);
    const request = { params: { id: ID_A }, body: { email: 'ja@existe.com' }, user: { sub: ID_A } } as never;
    const reply = mockReply();
    await updateUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(409);
  });
});

describe('deleteUserController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await deleteUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 404 quando o usuário a deletar não é encontrado', async () => {
    vi.mocked(deleteUser).mockResolvedValue(null);
    const request = { params: { id: ID_A }, user: { sub: ID_A } } as never;
    const reply = mockReply();
    await deleteUserController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(404);
  });
});
