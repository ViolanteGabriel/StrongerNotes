import { describe, it, expect } from 'vitest';
import { loginBodySchema } from './auth.schema.js';

// Testes de UNIDADE do schema de login (Zod). Sem API, sem banco.

describe('loginBodySchema', () => {
  it('aceita um login válido', () => {
    const r = loginBodySchema.safeParse({
      email: 'ana@email.com',
      password: 'senha12345',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita e-mail em formato inválido', () => {
    const r = loginBodySchema.safeParse({
      email: 'nao-e-email',
      password: 'senha12345',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const r = loginBodySchema.safeParse({
      email: 'ana@email.com',
      password: '123',
    });
    expect(r.success).toBe(false); // regra .min(8)
  });

  it('rejeita quando falta a senha', () => {
    const r = loginBodySchema.safeParse({ email: 'ana@email.com' });
    expect(r.success).toBe(false);
  });

  it('normaliza o e-mail para minúsculas e remove espaços', () => {
    const r = loginBodySchema.safeParse({
      email: '  ANA@Email.com  ',
      password: 'senha12345',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('ana@email.com'); // .trim().toLowerCase()
  });

  it('rejeita campos extras não previstos (strict)', () => {
    const r = loginBodySchema.safeParse({
      email: 'ana@email.com',
      password: 'senha12345',
      lembrar: true,
    });
    expect(r.success).toBe(false); // .strict() proíbe chaves a mais
  });
});
