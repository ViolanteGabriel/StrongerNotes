import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getWorkouts } from '../../services/requests/workouts/getWorkouts';
import { getSessions } from '../../services/requests/sessions/getSessions';
import { getSessionById } from '../../services/requests/sessions/getSessionById';
import { createSession } from '../../services/requests/sessions/createSession';

jest.mock('../../services/requests/workouts/getWorkouts');
jest.mock('../../services/requests/sessions/getSessions');
jest.mock('../../services/requests/sessions/getSessionById');
jest.mock('../../services/requests/sessions/createSession');

const mockGetWorkouts = getWorkouts as jest.MockedFunction<typeof getWorkouts>;
const mockGetSessions = getSessions as jest.MockedFunction<typeof getSessions>;
const mockGetSessionById = getSessionById as jest.MockedFunction<typeof getSessionById>;
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>;

const mockLogout = jest.fn();
const mockNavigate = jest.fn();
const mockToggleTheme = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderDashboard() {
  return render(
    <AuthContext.Provider
      value={{
        user: { _id: '1', name: 'TestUser', email: 'test@test.com' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
        updateUserData: jest.fn(),
      }}
    >
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: mockToggleTheme }}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DashboardFlow', () => {
  it('Renders empty state properly', async () => {
    mockGetWorkouts.mockResolvedValueOnce([]);
    mockGetSessions.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome back, TestUser!')).toBeInTheDocument();
      expect(screen.getByText('No routines created yet.')).toBeInTheDocument();
      // Empty sessions state
      expect(screen.getByText('No workouts registered yet.')).toBeInTheDocument();
    });
  });

  it('Renders routines and sessions', async () => {
    mockGetWorkouts.mockResolvedValueOnce([
      { _id: 'w1', name: 'Treino A', exercises: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '' } as any
    ]);

    mockGetSessions.mockResolvedValueOnce([
      { _id: 's1', workout: { _id: 'w1', name: 'Treino A' }, owner: 'u1', date: '2024-01-01T00:00:00Z', notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '' }
    ]);

    mockGetSessionById.mockResolvedValue({
      _id: 's1',
      workout: { _id: 'w1', name: 'Treino A', exercises: [] },
      owner: 'u1',
      date: '2024-01-01T00:00:00Z',
      notes: null,
      sets: [{ _id: 'set1', exercise: { _id: 'e1', name: 'Bench', category: 'strength', muscleGroup: 'Chest', isCustom: false, createdBy: null }, order: 0, reps: 10, weightKg: 100, durationSecs: null, restSecs: null, notes: null, createdAt: '' }]
    } as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Treino A').length).toBeGreaterThan(0);
      // Should show total volume calculated: 10 * 100 = 1000
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  it('Start routine flow', async () => {
    mockGetWorkouts.mockResolvedValueOnce([
      { _id: 'w1', name: 'Treino B', exercises: [], createdAt: '', updatedAt: '', owner: 'u1' } as any
    ]);
    mockGetSessions.mockResolvedValueOnce([]);
    
    mockCreateSession.mockResolvedValueOnce({ _id: 's2', workout: 'w1', owner: 'u1', date: '', notes: null });

    renderDashboard();

    await waitFor(() => expect(screen.getByText('Treino B')).toBeInTheDocument());

    // Start button has aria-label "Start {workout.name}"
    const startBtn = screen.getByRole('button', { name: /start treino b/i });
    await userEvent.click(startBtn);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith({ workoutId: 'w1' });
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/s2');
    });
  });

  it('Logout flow', async () => {
    mockGetWorkouts.mockResolvedValueOnce([]);
    mockGetSessions.mockResolvedValueOnce([]);

    renderDashboard();
    
    await waitFor(() => expect(screen.getByText('Sign Out')).toBeInTheDocument());
    
    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    await userEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('Theme toggle', async () => {
    mockGetWorkouts.mockResolvedValueOnce([]);
    mockGetSessions.mockResolvedValueOnce([]);

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Training Dashboard')).toBeInTheDocument();
    });
    
    const themeBtn = screen.getByRole('button', { name: /toggle theme/i });
    await userEvent.click(themeBtn);
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('Navigate to new workout page', async () => {
    mockGetWorkouts.mockResolvedValueOnce([]);
    mockGetSessions.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => expect(screen.getByRole('button', { name: /new workout/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /new workout/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/workouts/new');
  });

  it('Navigate to history page', async () => {
    mockGetWorkouts.mockResolvedValueOnce([]);
    mockGetSessions.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });
});
