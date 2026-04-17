import type { FastifyReply, FastifyRequest } from 'fastify';
import { loginBodySchema } from './auth.schema.js';
import { validateCredentials } from './auth.service.js';

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = loginBodySchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.status(400).send({
      error: 'Validation error',
      details: parsedBody.error.format(),
    });
  }

  const { email, password } = parsedBody.data;
  const user = await validateCredentials(email, password);

  if (!user) {
    return reply.status(401).send({ error: 'Invalid email or password' });
  }

  const token = await reply.jwtSign(
    { sub: String(user._id), email: user.email, name: user.name },
    { expiresIn: '7d' }
  );

  return reply.status(200).send({
    data: {
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    },
  });
}
