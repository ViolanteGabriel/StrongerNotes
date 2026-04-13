import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app.js';
import { User } from '../users/users.model.js';
import { hash } from 'bcryptjs';

describe('Auth Module', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should be able to authenticate with correct credentials', async () => {
    const passwordHash = await hash('password123', 12);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user.email).toBe('test@example.com');
  });

  it('should not be able to authenticate with wrong password', async () => {
    const passwordHash = await hash('password123', 12);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toBe('Invalid e-mail or password');
  });

  it('should not be able to authenticate with non-existent user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toBe('Invalid e-mail or password');
  });
});
