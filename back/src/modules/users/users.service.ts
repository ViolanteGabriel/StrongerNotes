import { User } from './users.model.js';
import type { CreateUserBody } from './users.schema.js';

export async function listUsers() {
  return User.find().sort({ createdAt: -1 }).lean();
}

export async function createUser(payload: CreateUserBody) {
  const user = await User.create(payload);
  return user.toObject();
}

export async function findUserById(id: string) {
  return User.findById(id).lean();
}
