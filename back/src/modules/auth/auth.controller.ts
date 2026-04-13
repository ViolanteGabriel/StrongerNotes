import type { FastifyReply, FastifyRequest } from 'fastify';
import { loginBodySchema } from './auth.schema.js';
import { authenticate } from './auth.service.js';

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = loginBodySchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.status(400).send({
      error: 'Validation error',
      details: parsedBody.error.format(),
    });
  }

  const user = await authenticate(parsedBody.data);

  if (!user) {
    return reply.status(401).send({ error: 'Invalid e-mail or password' });
  }

  const token = await reply.jwtSign(
    {
      name: user.name,
      email: user.email,
    },
    {
      sign: {
        sub: user._id.toString(),
      },
    }
  );

  return reply.status(200).send({
    data: {
      user,
      token,
    },
  });
}
