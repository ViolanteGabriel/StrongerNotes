import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyReply } from 'fastify';


// Aqui "mockamos" o módulo de service: trocamos cada função por uma função falsa (vi.fn()) cujo retorno nós controlamos. Assim conseguimos simular "sessão não
// encontrada", "sessão de outro usuário", etc., e verificar como o controller reage.

vi.mock('./sessions.service.js', () => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  findSessionById: vi.fn(),
  deleteSession: vi.fn(),
  listSetsBySession: vi.fn(),
  createSet: vi.fn(),
  updateSet: vi.fn(),
  deleteSet: vi.fn(),
}));

import {
  getSessionByIdController,
  deleteSessionController,
  createSetController,
  updateSetController,
  deleteSetController,
} from './sessions.controller.js';
import { findSessionById } from './sessions.service.js';

// "reply" falso: registra com que status/dados o controller respondeu.
// status() devolve o próprio reply pra permitir o encadeamento reply.status(400).send(...)
function mockReply() {
  const reply = {} as Record<string, ReturnType<typeof vi.fn>>;
  reply.status = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as unknown as FastifyReply;
}

const VALID_ID = 'a'.repeat(24); // ObjectId válido (24 hex)
const findSessionByIdMock = vi.mocked(findSessionById);

beforeEach(() => {
  vi.clearAllMocks(); // zera o histórico das funções falsas entre os testes
});

describe('getSessionByIdController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, user: { sub: 'user1' } } as never;
    const reply = mockReply();
    await getSessionByIdController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });
});

describe('deleteSessionController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, user: { sub: 'user1' } } as never;
    const reply = mockReply();
    await deleteSessionController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });
});

describe('createSetController', () => {
  it('responde 400 quando o id da sessão é inválido', async () => {
    const request = { params: { id: '123' }, body: { exerciseId: VALID_ID }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await createSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 400 quando o corpo é inválido (sem exerciseId)', async () => {
    const request = { params: { id: VALID_ID }, body: {}, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await createSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 403 quando a sessão pertence a outro usuário', async () => {
    // simulamos o banco devolvendo uma sessão cujo dono é "outro"
    findSessionByIdMock.mockResolvedValue({ owner: { toString: () => 'outro' } } as never);
    const request = { params: { id: VALID_ID }, body: { exerciseId: VALID_ID }, user: { sub: 'eu' } } as never;
    const reply = mockReply();
    await createSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe('updateSetController', () => {
  it('responde 400 quando os ids são inválidos', async () => {
    const request = { params: { id: '123', setId: '456' }, body: { reps: 10 }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await updateSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 400 quando o corpo está vazio', async () => {
    const request = { params: { id: VALID_ID, setId: VALID_ID }, body: {}, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await updateSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 403 quando a sessão pertence a outro usuário', async () => {
    findSessionByIdMock.mockResolvedValue({ owner: { toString: () => 'outro' } } as never);
    const request = { params: { id: VALID_ID, setId: VALID_ID }, body: { reps: 10 }, user: { sub: 'eu' } } as never;
    const reply = mockReply();
    await updateSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe('deleteSetController', () => {
  it('responde 400 quando os ids são inválidos', async () => {
    const request = { params: { id: '123', setId: '456' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await deleteSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 403 quando a sessão pertence a outro usuário', async () => {
    findSessionByIdMock.mockResolvedValue({ owner: { toString: () => 'outro' } } as never);
    const request = { params: { id: VALID_ID, setId: VALID_ID }, user: { sub: 'eu' } } as never;
    const reply = mockReply();
    await deleteSetController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});
