import { describe, it, expect } from 'vitest';
import {
  createWorkoutBodySchema,
  updateWorkoutBodySchema,
  workoutIdParamsSchema,
} from './workouts.schema.js';

// Testes de UNIDADE dos schemas de treino (workout). Sem API, sem banco.
const ID = 'a'.repeat(24);

describe('createWorkoutBodySchema', () => {
  it('aceita um treino válido com lista de exercícios', () => {
    const r = createWorkoutBodySchema.safeParse({
      name: 'Treino A',
      exercises: [ID, 'b'.repeat(24)],
    });
    expect(r.success).toBe(true);
  });

  it('usa lista de exercícios vazia por padrão quando omitida', () => {
    const r = createWorkoutBodySchema.safeParse({ name: 'Treino B' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.exercises).toEqual([]); // .default([])
  });

  it('rejeita quando o nome está vazio', () => {
    const r = createWorkoutBodySchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
  });

  it('rejeita um id de exercício em formato inválido na lista', () => {
    const r = createWorkoutBodySchema.safeParse({
      name: 'Treino A',
      exercises: ['123'],
    });
    expect(r.success).toBe(false);
  });
});

describe('updateWorkoutBodySchema', () => {
  it('aceita atualizar só o nome', () => {
    const r = updateWorkoutBodySchema.safeParse({ name: 'Novo Nome' });
    expect(r.success).toBe(true);
  });

  it('rejeita objeto vazio (precisa de pelo menos um campo)', () => {
    const r = updateWorkoutBodySchema.safeParse({});
    expect(r.success).toBe(false); // o .refine() exige ao menos 1 campo
  });
});

describe('workoutIdParamsSchema', () => {
  it('aceita um ObjectId válido', () => {
    const r = workoutIdParamsSchema.safeParse({ id: ID });
    expect(r.success).toBe(true);
  });

  it('rejeita um id em formato inválido', () => {
    const r = workoutIdParamsSchema.safeParse({ id: 'abc' });
    expect(r.success).toBe(false);
  });
});
