import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProgressOverviewPage from '../../pages/ProgressOverviewPage';
import ProgressPage from '../../pages/ProgressPage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getAllExercisesProgress } from '../../services/requests/exercises/getAllExercisesProgress';
import { getExerciseProgress } from '../../services/requests/exercises/getExerciseProgress';

jest.mock('../../services/requests/exercises/getAllExercisesProgress');
jest.mock('../../services/requests/exercises/getExerciseProgress');

jest.mock('recharts', () => {
  const Original = jest.requireActual('recharts');
  return {
    ...Original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div data-testid="line-chart" />
  };
});

const mockGetAllExercisesProgress = getAllExercisesProgress as jest.MockedFunction<typeof getAllExercisesProgress>;
const mockGetExerciseProgress = getExerciseProgress as jest.MockedFunction<typeof getExerciseProgress>;

const mockAuthContext = {
  user: { _id: 'u1', name: 'TestUser', email: 'test@test.com' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUserData: jest.fn(),
};

describe('ProgressFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProgressOverviewPage', () => {
    it('shows empty state when there is no progress data', async () => {
      mockGetAllExercisesProgress.mockResolvedValueOnce([]);

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'light', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress']}>
              <Routes>
                <Route path="/progress" element={<ProgressOverviewPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('No data yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard');
      });
    });

    it('shows loading and then data', async () => {
      mockGetAllExercisesProgress.mockResolvedValueOnce([
        {
          exercise: { _id: 'e1', name: 'Bench Press', category: 'strength', muscleGroup: 'Chest', isCustom: false, createdBy: null },
          data: [
            { date: '2024-01-01T00:00:00Z', estimated1RM: 100, maxWeight: 80, totalVolume: 800 },
            { date: '2024-01-02T00:00:00Z', estimated1RM: 105, maxWeight: 85, totalVolume: 850 }
          ]
        },
        {
          exercise: { _id: 'e2', name: 'Run', category: 'cardio', muscleGroup: 'Legs', isCustom: false, createdBy: null },
          data: [
            { date: '2024-01-01T00:00:00Z', maxDuration: 600, totalDuration: 600 },
          ]
        }
      ] as any);

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress']}>
              <Routes>
                <Route path="/progress" element={<ProgressOverviewPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Bench Press').length).toBeGreaterThan(0);
        expect(screen.getByText('105 kg')).toBeInTheDocument(); // best 1RM
      });
      
      const benchPill = screen.getByRole('button', { name: 'Hide Bench Press strength progress' });
      const runPill = screen.getByRole('button', { name: 'Hide Run cardio progress' });

      await userEvent.click(benchPill);
      expect(screen.getByText(/select at least one exercise to see the chart/i)).toBeInTheDocument();

      await userEvent.click(benchPill);
      expect(screen.getByRole('button', { name: 'Hide Bench Press strength progress' })).toBeInTheDocument();

      await userEvent.click(runPill);
      expect(screen.getByText(/select at least one exercise to see the chart/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Show Run cardio progress' }));
      expect(screen.getByRole('button', { name: 'Hide Run cardio progress' })).toBeInTheDocument();
    });

    it('shows error state', async () => {
      mockGetAllExercisesProgress.mockRejectedValueOnce(new Error('error'));
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress']}>
              <Routes>
                <Route path="/progress" element={<ProgressOverviewPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Could not load progress data.')).toBeInTheDocument();
      });
    });
  });

  describe('ProgressPage (Single Exercise)', () => {
    it('shows strength progress', async () => {
      mockGetExerciseProgress.mockResolvedValueOnce({
        exercise: { _id: 'e1', name: 'Squat', category: 'strength', muscleGroup: 'Legs', isCustom: false, createdBy: null },
        data: [
          { date: '2024-01-01T00:00:00Z', estimated1RM: 100, maxWeight: 80, totalVolume: 800 },
          { date: '2024-01-02T00:00:00Z', estimated1RM: 120, maxWeight: 90, totalVolume: 900 }
        ]
      } as any);

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress/e1']}>
              <Routes>
                <Route path="/progress/:id" element={<ProgressPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Squat');
        expect(screen.getAllByText('120 kg').length).toBeGreaterThan(0); // best 1RM
        expect(screen.getByText('+20%')).toBeInTheDocument(); // improvement
      });
    });

    it('shows cardio progress', async () => {
      mockGetExerciseProgress.mockResolvedValueOnce({
        exercise: { _id: 'e2', name: 'Run', category: 'cardio', muscleGroup: 'Legs', isCustom: false, createdBy: null },
        data: [
          { date: '2024-01-01T00:00:00Z', maxDuration: 600, totalDuration: 600 },
          { date: '2024-01-02T00:00:00Z', maxDuration: 1200, totalDuration: 1200 }
        ]
      } as any);

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress/e2']}>
              <Routes>
                <Route path="/progress/:id" element={<ProgressPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Run');
        expect(screen.getAllByText('20m').length).toBeGreaterThan(0); // best duration
        expect(screen.getByText('+100%')).toBeInTheDocument(); // improvement
      });
    });

    it('shows error state', async () => {
      mockGetExerciseProgress.mockRejectedValueOnce(new Error('fail'));

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
            <MemoryRouter initialEntries={['/progress/e1']}>
              <Routes>
                <Route path="/progress/:id" element={<ProgressPage />} />
              </Routes>
            </MemoryRouter>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Could not load progress data. Exercise may not exist.')).toBeInTheDocument();
      });
    });
  });
});
