import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
}).strict();

export type LoginBody = z.infer<typeof loginBodySchema>;
