import { describe, it, expect } from 'vitest';
import {
  createSessionBodySchema,
  createSetBodySchema,
  updateSetBodySchema,
  setIdParamsSchema,
} from './sessions.schema.js';

// Testes de UNIDADE dos schemas de sessões e séries (sets). Sem API, sem banco.
// Um ObjectId válido = 24 caracteres hexadecimais.
const ID = 'a'.repeat(24);

describe('createSessionBodySchema', () => {
  it('aceita uma sessão com workoutId válido', () => {
    const r = createSessionBodySchema.safeParse({ workoutId: ID });
    expect(r.success).toBe(true);
  });

  it('rejeita um workoutId em formato inválido', () => {
    const r = createSessionBodySchema.safeParse({ workoutId: '123' });
    expect(r.success).toBe(false);
  });

  it('aceita uma data no formato datetime ISO', () => {
    const r = createSessionBodySchema.safeParse({
      workoutId: ID,
      date: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });

  it('rejeita notes com mais de 500 caracteres', () => {
    const r = createSessionBodySchema.safeParse({
      workoutId: ID,
      notes: 'x'.repeat(501),
    });
    expect(r.success).toBe(false);
  });
});

describe('createSetBodySchema', () => {
  it('aceita uma série válida', () => {
    const r = createSetBodySchema.safeParse({
      exerciseId: ID,
      reps: 10,
      weightKg: 40,
    });
    expect(r.success).toBe(true);
  });

  it('usa order = 0 por padrão quando omitido', () => {
    const r = createSetBodySchema.safeParse({ exerciseId: ID });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.order).toBe(0); // .default(0)
  });

  it('rejeita reps igual a zero (precisa ser positivo)', () => {
    const r = createSetBodySchema.safeParse({ exerciseId: ID, reps: 0 });
    expect(r.success).toBe(false); // .positive() exige > 0
  });

  it('rejeita weightKg negativo', () => {
    const r = createSetBodySchema.safeParse({ exerciseId: ID, weightKg: -5 });
    expect(r.success).toBe(false);
  });

  it('rejeita campos extras não previstos (strict)', () => {
    const r = createSetBodySchema.safeParse({ exerciseId: ID, serie: 1 });
    expect(r.success).toBe(false);
  });
});

describe('updateSetBodySchema', () => {
  it('aceita atualizar só as repetições', () => {
    const r = updateSetBodySchema.safeParse({ reps: 12 });
    expect(r.success).toBe(true);
  });

  it('rejeita objeto vazio (precisa de pelo menos um campo)', () => {
    const r = updateSetBodySchema.safeParse({});
    expect(r.success).toBe(false); // o .refine() exige ao menos 1 campo
  });
});

describe('setIdParamsSchema', () => {
  it('aceita dois ObjectIds válidos (id e setId)', () => {
    const r = setIdParamsSchema.safeParse({ id: ID, setId: ID });
    expect(r.success).toBe(true);
  });

  it('rejeita quando um dos ids é inválido', () => {
    const r = setIdParamsSchema.safeParse({ id: ID, setId: '123' });
    expect(r.success).toBe(false);
  });
});
