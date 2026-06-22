// Set non-database env vars before any module is imported.
// The MongoDB URI is provided by src/test/global-setup.ts.
process.env.NODE_ENV = 'test';
process.env.PORT = '3334';
process.env.JWT_SECRET = 'test_secret_key_must_be_32_characters_ok';
