import { compare } from 'bcryptjs';
import { User } from '../users/users.model.js';
import type { LoginBody } from './auth.schema.js';

export async function authenticate(payload: LoginBody) {
  const user = await User.findOne({ email: payload.email }).lean();

  if (!user) {
    return null;
  }

  const isPasswordValid = await compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
