import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { api } from '../../services/requests/api';
import { createUser } from '../../services/requests/users/createUser';

const TEST_PASSWORD = 'password123';
jest.setTimeout(120_000);

let app: any;
let mongoose: any;
let mongoServer: any;
let apiBaseUrl: string;
let uniqueCounter = 0;

function uniqueUser() {
  uniqueCounter += 1;
  const suffix = `${Date.now()}-${uniqueCounter}`;
  return {
    name: `Login Flow ${suffix}`,
    email: `login-flow-${suffix}@example.com`,
    password: TEST_PASSWORD,
  };
}

async function createAccount(overrides: Partial<ReturnType<typeof uniqueUser>> = {}) {
  const payload = { ...uniqueUser(), ...overrides };
  await createUser(payload);
  return payload;
}

function renderLoginFlowBack() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeAll(async () => {
  const timers = require('timers');
  Object.defineProperty(globalThis, 'setImmediate', { value: timers.setImmediate, configurable: true });
  Object.defineProperty(globalThis, 'clearImmediate', { value: timers.clearImmediate, configurable: true });

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'front-login-flow-test-secret';
  process.env.MONGOMS_DOWNLOAD_DIR = './node_modules/.cache/mongodb-memory-server';
  process.env.MONGOMS_PREFER_GLOBAL_PATH = 'false';

  const { MongoMemoryServer } = require('../../../../back/node_modules/mongodb-memory-server');
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  mongoose = require('../../../../back/node_modules/mongoose');
  await mongoose.connect(process.env.MONGODB_URI);

  const { buildApp } = await import('../../../../back/src/app');
  app = buildApp();
  await app.listen({ host: '127.0.0.1', port: 0 });

  const address = app.server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine backend test server address.');
  }

  apiBaseUrl = `http://127.0.0.1:${address.port}`;
  api.defaults.baseURL = apiBaseUrl;
});

beforeEach(async () => {
  localStorage.clear();

  if (mongoose?.connection?.readyState === 1) {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection: any) => collection.deleteMany({}))
    );
  }
});

afterAll(async () => {
  await app?.close();

  if (mongoose?.connection && mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  await mongoServer?.stop();
});

describe('LoginFlowBack', () => {
  it('creates an account in the backend and logs into it through the real auth provider', async () => {
    const account = await createAccount();
    renderLoginFlowBack();

    await userEvent.type(screen.getByLabelText(/email/i), account.email);
    await userEvent.type(screen.getByLabelText(/^password$/i), account.password);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toEqual(expect.any(String));
      expect(JSON.parse(localStorage.getItem('auth_user') ?? '{}')).toEqual(
        expect.objectContaining({
          name: account.name,
          email: account.email,
        })
      );
    });
  });

  it('shows the auth error returned by the backend for a real account with the wrong password', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const account = await createAccount();
    renderLoginFlowBack();

    await userEvent.type(screen.getByLabelText(/email/i), account.email);
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid e-?mail or password/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBeNull();

    consoleError.mockRestore();
  });
});
