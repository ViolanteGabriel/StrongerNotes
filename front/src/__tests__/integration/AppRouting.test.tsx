import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { getSessions } from '../../services/requests/sessions/getSessions';
import { getSessionById } from '../../services/requests/sessions/getSessionById';
import { getWorkouts } from '../../services/requests/workouts/getWorkouts';

jest.mock('../../services/requests/sessions/getSessions');
jest.mock('../../services/requests/sessions/getSessionById');
jest.mock('../../services/requests/workouts/getWorkouts');

const mockGetSessions = getSessions as jest.MockedFunction<typeof getSessions>;
const mockGetSessionById = getSessionById as jest.MockedFunction<typeof getSessionById>;
const mockGetWorkouts = getWorkouts as jest.MockedFunction<typeof getWorkouts>;

jest.mock('recharts', () => {
  const Original = jest.requireActual('recharts');
  return {
    ...Original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div data-testid="line-chart" />
  };
});

let mockCurrentInitialEntry = '/';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: any) => {
      const { MemoryRouter } = actual;
      return <MemoryRouter initialEntries={[mockCurrentInitialEntry]}>{children}</MemoryRouter>;
    }
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentInitialEntry = '/';
  localStorage.clear();
  mockGetSessions.mockResolvedValue([]);
  mockGetSessionById.mockResolvedValue({
    _id: 'session-1',
    workout: { _id: 'workout-1', name: 'Mock Workout', exercises: [] },
    owner: 'user-1',
    date: '2024-01-01T00:00:00.000Z',
    notes: null,
    sets: [],
  });
  mockGetWorkouts.mockResolvedValue([]);
});

describe('AppRouting', () => {
  it('Landing page renders on /', async () => {
    mockCurrentInitialEntry = '/';
    render(<App />);
    expect(screen.getByText(/Scientific precision for/i)).toBeInTheDocument();
  });

  it('Landing page links to dashboard when restored as authenticated', async () => {
    mockCurrentInitialEntry = '/';
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', name: 'User', email: 'test@test.com' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    });
  });

  it('toggles and persists theme in both directions', async () => {
    mockCurrentInitialEntry = '/';
    const { unmount } = render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(localStorage.getItem('theme')).toBe('dark');
    unmount();

    localStorage.setItem('theme', 'dark');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('Login page renders on /login', async () => {
    mockCurrentInitialEntry = '/login';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('Register page renders on /register', async () => {
    mockCurrentInitialEntry = '/register';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
  });

  it('Protected routes redirect to /login when unauthenticated', async () => {
    mockCurrentInitialEntry = '/dashboard';
    
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    });
  });

  it('Protected routes render when authenticated', async () => {
    mockCurrentInitialEntry = '/dashboard';
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', name: 'User', email: 'test@test.com' }));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, User!/i)).toBeInTheDocument();
    });
  });
});
