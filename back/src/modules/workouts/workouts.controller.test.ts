import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyReply } from 'fastify';

// Cobrimos aqui os caminhos de validação (400) do controller de treinos, que os testes de integração não exercitam.
vi.mock('./workouts.service.js', () => ({
  listWorkouts: vi.fn(),
  createWorkout: vi.fn(),
  findWorkoutById: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
}));

import {
  getWorkoutByIdController,
  updateWorkoutController,
  deleteWorkoutController,
} from './workouts.controller.js';

function mockReply() {
  const reply = {} as Record<string, ReturnType<typeof vi.fn>>;
  reply.status = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as unknown as FastifyReply;
}

const VALID_ID = 'a'.repeat(24);

beforeEach(() => vi.clearAllMocks());

describe('getWorkoutByIdController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await getWorkoutByIdController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });
});

describe('updateWorkoutController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, body: { name: 'X' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await updateWorkoutController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('responde 400 quando o corpo está vazio', async () => {
    const request = { params: { id: VALID_ID }, body: {}, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await updateWorkoutController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });
});

describe('deleteWorkoutController', () => {
  it('responde 400 quando o id é inválido', async () => {
    const request = { params: { id: '123' }, user: { sub: 'u1' } } as never;
    const reply = mockReply();
    await deleteWorkoutController(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });
});
