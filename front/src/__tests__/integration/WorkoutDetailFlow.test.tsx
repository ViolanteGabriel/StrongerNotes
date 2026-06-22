import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WorkoutDetailPage from '../../pages/WorkoutDetailPage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getWorkoutById } from '../../services/requests/workouts/getWorkoutById';
import { getExercises } from '../../services/requests/exercises/getExercises';
import { createSession } from '../../services/requests/sessions/createSession';
import { createWorkout } from '../../services/requests/workouts/createWorkout';
import { updateWorkout } from '../../services/requests/workouts/updateWorkout';
import { deleteWorkout } from '../../services/requests/workouts/deleteWorkout';

jest.mock('../../services/requests/workouts/getWorkoutById');
jest.mock('../../services/requests/exercises/getExercises');
jest.mock('../../services/requests/sessions/createSession');
jest.mock('../../services/requests/workouts/createWorkout');
jest.mock('../../services/requests/workouts/updateWorkout');
jest.mock('../../services/requests/workouts/deleteWorkout');

const mockGetWorkoutById = getWorkoutById as jest.MockedFunction<typeof getWorkoutById>;
const mockGetExercises = getExercises as jest.MockedFunction<typeof getExercises>;
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>;
const mockCreateWorkout = createWorkout as jest.MockedFunction<typeof createWorkout>;
const mockUpdateWorkout = updateWorkout as jest.MockedFunction<typeof updateWorkout>;
const mockDeleteWorkout = deleteWorkout as jest.MockedFunction<typeof deleteWorkout>;

const mockNavigate = jest.fn();
let mockWorkoutId = 'w1';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: mockWorkoutId }),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { _id: 'u1', name: 'TestUser', email: 'test@test.com' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUserData: jest.fn(),
};

const strengthExercise = {
  _id: 'ex1',
  name: 'Bench Press',
  muscleGroup: 'Chest',
  category: 'strength' as const,
  isCustom: false,
  createdBy: null,
};

const cardioExercise = {
  _id: 'ex2',
  name: 'Treadmill Run',
  muscleGroup: 'Cardio',
  category: 'cardio' as const,
  isCustom: false,
  createdBy: null,
};

function makeWorkout(overrides = {}) {
  return {
    _id: 'w1',
    name: 'Push Day',
    owner: 'u1',
    exercises: [] as any[],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function renderWorkoutDetail(workout: any, options: { routeId?: string; exercises?: any[]; theme?: 'dark' | 'light' } = {}) {
  mockWorkoutId = options.routeId ?? 'w1';
  if (workout) {
    mockGetWorkoutById.mockResolvedValueOnce(workout);
  } else if (mockWorkoutId !== 'new') {
    mockGetWorkoutById.mockRejectedValueOnce(new Error('not found'));
  }
  mockGetExercises.mockResolvedValue(options.exercises ?? [strengthExercise]);

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeContext.Provider value={{ theme: options.theme ?? 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <WorkoutDetailPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWorkoutId = 'w1';
});

describe('WorkoutDetailFlow', () => {
  it('Loads and displays workout name', async () => {
    renderWorkoutDetail(makeWorkout({ name: 'Push Day' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /push day/i })).toBeInTheDocument();
    });
  });

  it('Shows empty exercises state', async () => {
    renderWorkoutDetail(makeWorkout({ exercises: [] }));

    await waitFor(() => {
      expect(screen.getByText(/no exercises yet/i)).toBeInTheDocument();
    });
  });

  it('Shows workout exercises', async () => {
    renderWorkoutDetail(makeWorkout({ exercises: [strengthExercise] }));

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });
  });

  it('Start session flow navigates to new session', async () => {
    mockCreateSession.mockResolvedValueOnce({ _id: 's1', workout: 'w1', owner: 'u1', date: '', notes: null });
    renderWorkoutDetail(makeWorkout({ exercises: [strengthExercise] }));

    await waitFor(() => expect(screen.getByRole('button', { name: /start session for push day/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /start session for push day/i }));

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith({ workoutId: 'w1' });
      expect(mockNavigate).toHaveBeenCalledWith('/sessions/s1');
    });
  });

  it('Delete workout navigates to dashboard after confirm', async () => {
    mockDeleteWorkout.mockResolvedValueOnce(undefined as any);
    window.confirm = jest.fn(() => true);

    renderWorkoutDetail(makeWorkout({ exercises: [strengthExercise] }));

    await waitFor(() => expect(screen.getByRole('button', { name: /delete routine/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete routine/i }));

    await waitFor(() => {
      expect(mockDeleteWorkout).toHaveBeenCalledWith('w1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Cancel delete workout does nothing', async () => {
    window.confirm = jest.fn(() => false);

    renderWorkoutDetail(makeWorkout({ exercises: [strengthExercise] }));

    await waitFor(() => expect(screen.getByRole('button', { name: /delete routine/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete routine/i }));

    expect(mockDeleteWorkout).not.toHaveBeenCalled();
  });

  it('Redirects to dashboard when workout not found', async () => {
    renderWorkoutDetail(null);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Opens exercise picker and shows available exercises', async () => {
    renderWorkoutDetail(makeWorkout({ exercises: [] }));

    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add bench press/i })).toBeInTheDocument();
    });
  });

  it('Filters exercise picker and shows no results', async () => {
    renderWorkoutDetail(makeWorkout({ exercises: [] }));

    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    await userEvent.type(screen.getByLabelText(/search exercises/i), 'nothing matches');

    expect(await screen.findByText(/no exercises found/i)).toBeInTheDocument();
  });

  it('Adds a cardio exercise from the picker', async () => {
    const updated = makeWorkout({ exercises: [cardioExercise] });
    mockUpdateWorkout.mockResolvedValueOnce(updated);

    renderWorkoutDetail(makeWorkout({ exercises: [] }), { exercises: [cardioExercise] });

    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    await userEvent.click(screen.getByRole('button', { name: /add treadmill run/i }));

    await waitFor(() => {
      expect(mockUpdateWorkout).toHaveBeenCalledWith('w1', { exercises: ['ex2'] });
      expect(screen.getByText('Treadmill Run')).toBeInTheDocument();
    });
  });

  it('Edits and cancels the routine name', async () => {
    renderWorkoutDetail(makeWorkout({ name: 'Push Day', exercises: [strengthExercise] }), { theme: 'light' });

    await waitFor(() => expect(screen.getByRole('heading', { name: /push day/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /edit routine name/i }));
    await userEvent.clear(screen.getByRole('textbox', { name: /^routine name$/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /^routine name$/i }), 'Pull Day');
    await userEvent.click(screen.getByRole('button', { name: /cancel routine name edit/i }));

    expect(screen.getByRole('heading', { name: /push day/i })).toBeInTheDocument();
  });

  it('Creates a new routine from the new route', async () => {
    mockCreateWorkout.mockResolvedValueOnce(makeWorkout({ _id: 'new-workout', name: 'Leg Day' }));

    renderWorkoutDetail(null, { routeId: 'new' });

    const nameInput = screen.getByRole('textbox', { name: /^routine name$/i });
    expect(screen.getByRole('button', { name: /save routine name/i })).toBeDisabled();

    await userEvent.type(nameInput, 'Leg Day');
    await userEvent.click(screen.getByRole('button', { name: /save routine name/i }));

    await waitFor(() => {
      expect(mockCreateWorkout).toHaveBeenCalledWith({ name: 'Leg Day' });
      expect(mockNavigate).toHaveBeenCalledWith('/workouts/new-workout', { replace: true });
    });
  });

  it('Remove exercise from workout', async () => {
    const updated = makeWorkout({ exercises: [] });
    mockUpdateWorkout.mockResolvedValueOnce(updated);

    renderWorkoutDetail(makeWorkout({ exercises: [strengthExercise] }));

    await waitFor(() => expect(screen.getByText('Bench Press')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /remove bench press/i }));

    await waitFor(() => {
      expect(mockUpdateWorkout).toHaveBeenCalledWith('w1', { exercises: [] });
    });
  });
});
