import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export async function setup() {
  mongod = await MongoMemoryServer.create({
    instance: {
      port: 27019,
      ip: '127.0.0.1',
      dbName: 'strongernotes_test',
    },
  });
  process.env.MONGODB_URI = mongod.getUri('strongernotes_test');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only-at-least-32-chars';
  process.env.PORT = '0';
}

export async function teardown() {
  if (mongod) {
    await mongod.stop();
  }
}
