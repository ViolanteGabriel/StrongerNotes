import { describe, it, expect } from 'vitest';
import {
  createExerciseBodySchema,
  exerciseIdParamsSchema,
} from './exercises.schema.js';

// Testes de UNIDADE dos schemas de exercício (Zod). Sem API, sem banco.

describe('createExerciseBodySchema', () => {
  it('aceita um exercício de força válido', () => {
    const r = createExerciseBodySchema.safeParse({
      name: 'Supino',
      category: 'strength',
      muscleGroup: 'Peito',
    });
    expect(r.success).toBe(true);
  });

  it('aceita a categoria cardio', () => {
    const r = createExerciseBodySchema.safeParse({
      name: 'Corrida',
      category: 'cardio',
      muscleGroup: 'Pernas',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita uma categoria fora do enum (só strength ou cardio)', () => {
    const r = createExerciseBodySchema.safeParse({
      name: 'Yoga',
      category: 'flexibility',
      muscleGroup: 'Corpo todo',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita quando o nome está vazio', () => {
    const r = createExerciseBodySchema.safeParse({
      name: '',
      category: 'strength',
      muscleGroup: 'Peito',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita quando falta o grupo muscular', () => {
    const r = createExerciseBodySchema.safeParse({
      name: 'Supino',
      category: 'strength',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita campos extras não previstos (strict)', () => {
    const r = createExerciseBodySchema.safeParse({
      name: 'Supino',
      category: 'strength',
      muscleGroup: 'Peito',
      dificuldade: 'alta',
    });
    expect(r.success).toBe(false);
  });
});

describe('exerciseIdParamsSchema', () => {
  it('aceita um ObjectId válido (24 caracteres hex)', () => {
    const r = exerciseIdParamsSchema.safeParse({ id: 'a'.repeat(24) });
    expect(r.success).toBe(true);
  });

  it('rejeita um id em formato inválido', () => {
    const r = exerciseIdParamsSchema.safeParse({ id: 'xyz' });
    expect(r.success).toBe(false);
  });
});
