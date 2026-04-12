import { z } from 'zod';

export const createUserBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
