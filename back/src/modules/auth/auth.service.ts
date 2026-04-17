import { compare } from 'bcryptjs';
import { User } from '../users/users.model.js';

export async function validateCredentials(email: string, password: string) {
  const user = await User.findOne({ email }).lean();

  if (!user) return null;

  const passwordMatches = await compare(password, user.passwordHash);
  if (!passwordMatches) return null;

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
