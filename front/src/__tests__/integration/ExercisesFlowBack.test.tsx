import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExercisesPage from '../../pages/ExercisesPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { api } from '../../services/requests/api';
import { login } from '../../services/requests/auth/login';
import { createExercise } from '../../services/requests/exercises/createExercise';
import { createUser } from '../../services/requests/users/createUser';

const TEST_PASSWORD = 'password123';
jest.setTimeout(120_000);

let app: any;
let mongoose: any;
let mongoServer: any;
let apiBaseUrl: string;
let uniqueCounter = 0;

function uniqueSuffix() {
  uniqueCounter += 1;
  return `${Date.now()}-${uniqueCounter}`;
}

function uniqueUser() {
  const suffix = uniqueSuffix();
  return {
    name: `Exercises Flow ${suffix}`,
    email: `exercises-flow-${suffix}@example.com`,
    password: TEST_PASSWORD,
  };
}

async function signInWithBackend() {
  const account = uniqueUser();
  await createUser(account);

  const { token, user } = await login({ email: account.email, password: account.password });
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));

  return { account, user, token };
}

function renderExercisesFlowBack() {
  return render(
    <AuthProvider>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <ExercisesPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

beforeAll(async () => {
  const timers = require('timers');
  Object.defineProperty(globalThis, 'setImmediate', { value: timers.setImmediate, configurable: true });
  Object.defineProperty(globalThis, 'clearImmediate', { value: timers.clearImmediate, configurable: true });

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'front-exercises-flow-test-secret';
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

describe('ExercisesFlowBack', () => {
  it('renders exercises created directly in the backend for the signed-in user', async () => {
    await signInWithBackend();
    const bench = await createExercise({ name: 'Back Bench Press', category: 'strength', muscleGroup: 'Chest' });
    const run = await createExercise({ name: 'Back Tempo Run', category: 'cardio', muscleGroup: 'Full Body' });

    renderExercisesFlowBack();

    expect(await screen.findByText(bench.name)).toBeInTheDocument();
    expect(screen.getByText(run.name)).toBeInTheDocument();
    expect(screen.getAllByText('Chest').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Full Body').length).toBeGreaterThan(0);
    expect(screen.getByText('2 exercises shown')).toBeInTheDocument();
  });

  it('filters real backend exercises by muscle group and category', async () => {
    await signInWithBackend();
    await createExercise({ name: 'Back Cable Fly', category: 'strength', muscleGroup: 'Chest' });
    await createExercise({ name: 'Back Interval Run', category: 'cardio', muscleGroup: 'Full Body' });

    renderExercisesFlowBack();

    expect(await screen.findByText('Back Cable Fly')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Chest' }));

    expect(screen.getByText('Back Cable Fly')).toBeInTheDocument();
    expect(screen.queryByText('Back Interval Run')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'All' })[1]);
    await userEvent.click(screen.getByRole('button', { name: /cardio/i }));

    expect(screen.queryByText('Back Cable Fly')).not.toBeInTheDocument();
    expect(screen.getByText('Back Interval Run')).toBeInTheDocument();
  });

  it('creates a custom exercise through the real backend and displays it', async () => {
    await signInWithBackend();
    renderExercisesFlowBack();

    await waitFor(() => expect(screen.getByText('No exercises match your filters.')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /new exercise/i }));
    await userEvent.type(screen.getByPlaceholderText('e.g. Cable Fly'), 'Back Face Pull');
    await userEvent.type(screen.getByPlaceholderText('e.g. Chest'), 'Shoulders');
    await userEvent.click(screen.getByRole('button', { name: /create exercise/i }));

    expect(await screen.findByText('Back Face Pull')).toBeInTheDocument();
    expect(screen.getAllByText('Shoulders').length).toBeGreaterThan(0);
    expect(screen.getByText('1 exercise shown')).toBeInTheDocument();
  });
});
