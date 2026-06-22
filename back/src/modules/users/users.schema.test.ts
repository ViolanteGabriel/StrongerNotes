import { describe, it, expect } from 'vitest';
import {
  createUserBodySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from './users.schema.js';

// Testes de UNIDADE: validam só a regra de validação (Zod), sem API nem banco.

describe('createUserBodySchema', () => {
  it('aceita um cadastro válido', () => {
    const r = createUserBodySchema.safeParse({
      name: 'Ana', email: 'ana@email.com', password: 'senha12345',
    });
    expect(r.success).toBe(true);   // .safeParse devolve { success: true, data } quando passa
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const r = createUserBodySchema.safeParse({
      name: 'Ana', email: 'ana@email.com', password: '123',
    });
    expect(r.success).toBe(false);  // a regra .min(8) deve barrar
  });

  it('rejeita e-mail em formato inválido', () => {
    const r = createUserBodySchema.safeParse({
      name: 'Ana', email: 'isso-nao-e-email', password: 'senha12345',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita quando falta o nome', () => {
    const r = createUserBodySchema.safeParse({
      email: 'ana@email.com', password: 'senha12345',
    });
    expect(r.success).toBe(false);
  });

  it('normaliza o e-mail para minúsculas e remove espaços', () => {
    const r = createUserBodySchema.safeParse({
      name: 'Ana', email: '  ANA@Email.com  ', password: 'senha12345',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('ana@email.com'); // .toLowerCase().trim()
  });

  it('rejeita campos extras não previstos (strict)', () => {
    const r = createUserBodySchema.safeParse({
      name: 'Ana', email: 'ana@email.com', password: 'senha12345', admin: true,
    });
    expect(r.success).toBe(false);  // .strict() proíbe chaves a mais
  });
});

describe('updateUserBodySchema', () => {
  it('aceita atualizar só o nome', () => {
    const r = updateUserBodySchema.safeParse({ name: 'Novo Nome' });
    expect(r.success).toBe(true);
  });

  it('rejeita objeto vazio (precisa de pelo menos um campo)', () => {
    const r = updateUserBodySchema.safeParse({});
    expect(r.success).toBe(false);  // o .refine() exige ao menos 1 campo
  });
});

describe('userIdParamsSchema', () => {
  it('aceita um ObjectId válido (24 caracteres hex)', () => {
    const r = userIdParamsSchema.safeParse({ id: 'a'.repeat(24) });
    expect(r.success).toBe(true);
  });

  it('rejeita um id com formato inválido', () => {
    const r = userIdParamsSchema.safeParse({ id: '123' });
    expect(r.success).toBe(false);  // não bate com o regex de ObjectId
  });
});