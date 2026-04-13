import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app.js';
import { User } from './users.model.js';

describe('Users Module', () => {
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

  it('should be able to create a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty('_id');
    expect(body.data.name).toBe('John Doe');
    expect(body.data.email).toBe('john@example.com');
    expect(body.data).not.toHaveProperty('passwordHash');
  });

  it('should not be able to create a user with duplicate email', async () => {
    await User.create({
      name: 'Existing User',
      email: 'john@example.com',
      passwordHash: 'hashedpassword',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).error).toBe('E-mail already registered');
  });

  it('should be able to list users', async () => {
    await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      passwordHash: 'hashed',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('User 1');
  });

  it('should be able to get user by id', async () => {
    const user = await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      passwordHash: 'hashed',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${user._id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.name).toBe('User 1');
  });
});
