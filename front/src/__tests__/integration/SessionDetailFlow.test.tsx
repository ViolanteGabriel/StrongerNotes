import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SessionPage from '../../pages/SessionPage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getSessionById } from '../../services/requests/sessions/getSessionById';
import { createSet } from '../../services/requests/sessions/createSet';
import { updateSet } from '../../services/requests/sessions/updateSet';
import { deleteSet } from '../../services/requests/sessions/deleteSet';
import { deleteSession } from '../../services/requests/sessions/deleteSession';

jest.mock('../../services/requests/sessions/getSessionById');
jest.mock('../../services/requests/sessions/createSet');
jest.mock('../../services/requests/sessions/updateSet');
jest.mock('../../services/requests/sessions/deleteSet');
jest.mock('../../services/requests/sessions/deleteSession');

const mockGetSessionById = getSessionById as jest.MockedFunction<typeof getSessionById>;
const mockCreateSet = createSet as jest.MockedFunction<typeof createSet>;
const mockUpdateSet = updateSet as jest.MockedFunction<typeof updateSet>;
const mockDeleteSet = deleteSet as jest.MockedFunction<typeof deleteSet>;
const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'session-1' }),
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

const makeSession = (sets: any[] = [], exercises: any[] = [strengthExercise]) => ({
  _id: 'session-1',
  workout: { _id: 'w1', name: 'Push Day', exercises },
  owner: 'u1',
  date: '2024-06-15T00:00:00.000Z',
  notes: null,
  sets,
});

function makeSet(overrides = {}) {
  return {
    _id: 'set-1',
    session: 'session-1',
    exercise: strengthExercise,
    order: 0,
    reps: 10,
    weightKg: 80,
    durationSecs: null,
    restSecs: null,
    notes: null,
    createdAt: '',
    ...overrides,
  };
}

function renderSessionDetail(sessionData: any) {
  if (sessionData) {
    mockGetSessionById.mockResolvedValueOnce(sessionData);
  } else {
    mockGetSessionById.mockRejectedValueOnce(new Error('not found'));
  }

  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <SessionPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SessionDetailFlow', () => {
  it('Loads session header with workout name', async () => {
    renderSessionDetail(makeSession());

    await waitFor(() => {
      expect(screen.getByText('Push Day')).toBeInTheDocument();
    });
  });

  it('Shows "No sets logged yet" when exercise has no sets', async () => {
    renderSessionDetail(makeSession([]));

    await waitFor(() => {
      expect(screen.getByText('No sets logged yet')).toBeInTheDocument();
    });
  });

  it('Shows empty routine message when the workout has no exercises', async () => {
    renderSessionDetail(makeSession([], []));

    await waitFor(() => {
      expect(screen.getByText(/this routine has no exercises/i)).toBeInTheDocument();
    });
  });

  it('Displays logged sets correctly', async () => {
    const set = makeSet({ reps: 10, weightKg: 80 });
    renderSessionDetail(makeSession([set]));

    await waitFor(() => {
      // Set summary: "10 reps · 80 kg"
      expect(screen.getByText(/10 reps/)).toBeInTheDocument();
      expect(screen.getByText(/80 kg/)).toBeInTheDocument();
    });
  });

  it('Displays no-data and notes for sparse sets', async () => {
    const set = makeSet({ reps: null, weightKg: null, notes: 'Felt easy' });
    renderSessionDetail(makeSession([set]));

    await waitFor(() => {
      expect(screen.getByText(/no data logged/i)).toBeInTheDocument();
      expect(screen.getByText('Felt easy')).toBeInTheDocument();
      expect(screen.getByLabelText(/1 set logged/i)).toBeInTheDocument();
    });
  });

  it('Add set flow via Log Set button', async () => {
    const addedSet = makeSet({ _id: 'set-new', reps: 5, weightKg: 90 });
    mockCreateSet.mockResolvedValueOnce(addedSet);

    renderSessionDetail(makeSession([]));

    await waitFor(() => expect(screen.getByText('Push Day')).toBeInTheDocument());

    // Click "Log Set" button for the exercise
    await userEvent.click(screen.getByRole('button', { name: /log set for bench press/i }));

    // Fill in reps and weight
    const repsInput = screen.getByRole('spinbutton', { name: /reps/i });
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i });
    await userEvent.clear(repsInput);
    await userEvent.type(repsInput, '5');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '90');

    // Save the set
    await userEvent.click(screen.getByRole('button', { name: /log set for bench press/i }));

    await waitFor(() => {
      expect(mockCreateSet).toHaveBeenCalledWith('session-1', expect.objectContaining({
        exerciseId: 'ex1',
      }));
      expect(screen.getByText(/5 reps/)).toBeInTheDocument();
    });
  });

  it('Cancels add set flow', async () => {
    renderSessionDetail(makeSession([]));

    await waitFor(() => expect(screen.getByText('Push Day')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /log set for bench press/i }));
    expect(screen.getByRole('button', { name: /cancel set for bench press/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel set for bench press/i }));
    expect(screen.queryByRole('button', { name: /cancel set for bench press/i })).not.toBeInTheDocument();
  });

  it('Adds a cardio set with duration and rest', async () => {
    const addedSet = makeSet({
      _id: 'cardio-set',
      exercise: cardioExercise,
      reps: null,
      weightKg: null,
      durationSecs: 600,
      restSecs: 90,
    });
    mockCreateSet.mockResolvedValueOnce(addedSet);

    renderSessionDetail(makeSession([], [cardioExercise]));

    await waitFor(() => expect(screen.getByText('Treadmill Run')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /log set for treadmill run/i }));
    await userEvent.type(screen.getByRole('spinbutton', { name: /duration/i }), '600');
    await userEvent.type(screen.getByRole('spinbutton', { name: /rest/i }), '90');
    await userEvent.click(screen.getByRole('button', { name: /log set for treadmill run/i }));

    await waitFor(() => {
      expect(mockCreateSet).toHaveBeenCalledWith('session-1', expect.objectContaining({
        durationSecs: 600,
        restSecs: 90,
      }));
      expect(screen.getByText(/600s/)).toBeInTheDocument();
    });
  });

  it('Edits a strength set and falls back invalid values to one', async () => {
    const set = makeSet({ reps: 10, weightKg: 80, restSecs: 60, notes: 'old' });
    const updated = makeSet({ reps: 1, weightKg: 1, durationSecs: 1, restSecs: 1, notes: '' });
    mockUpdateSet.mockResolvedValueOnce(updated);

    renderSessionDetail(makeSession([set]));

    await waitFor(() => expect(screen.getByText(/10 reps/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /edit set/i }));
    await userEvent.clear(screen.getByRole('spinbutton', { name: /edit reps/i }));
    await userEvent.type(screen.getByRole('spinbutton', { name: /edit reps/i }), '-5');
    await userEvent.clear(screen.getByRole('spinbutton', { name: /edit weight/i }));
    await userEvent.type(screen.getByRole('spinbutton', { name: /edit weight/i }), 'nope');
    await userEvent.clear(screen.getByRole('spinbutton', { name: /edit rest/i }));
    await userEvent.clear(screen.getByRole('textbox', { name: /edit notes/i }));
    await userEvent.click(screen.getByRole('button', { name: /save set changes/i }));

    await waitFor(() => {
      expect(mockUpdateSet).toHaveBeenCalledWith('session-1', 'set-1', expect.objectContaining({
        reps: 1,
        weightKg: 1,
        restSecs: 1,
        notes: '',
      }));
    });
  });

  it('Cancels set editing', async () => {
    renderSessionDetail(makeSession([makeSet()]));

    await waitFor(() => expect(screen.getByText(/10 reps/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /edit set/i }));
    expect(screen.getByRole('button', { name: /save set changes/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel set edit/i }));
    expect(screen.queryByRole('button', { name: /save set changes/i })).not.toBeInTheDocument();
  });

  it('Delete set flow', async () => {
    mockDeleteSet.mockResolvedValueOnce(undefined as any);
    const set = makeSet({ reps: 10, weightKg: 80 });
    renderSessionDetail(makeSession([set]));

    await waitFor(() => expect(screen.getByText(/10 reps/)).toBeInTheDocument());

    const deleteSetBtn = screen.getByRole('button', { name: /delete set/i });
    await userEvent.click(deleteSetBtn);

    await waitFor(() => {
      expect(mockDeleteSet).toHaveBeenCalledWith('session-1', 'set-1');
      expect(screen.queryByText(/10 reps/)).not.toBeInTheDocument();
    });
  });

  it('Finish session navigates to dashboard', async () => {
    renderSessionDetail(makeSession([]));

    await waitFor(() => expect(screen.getByText('Push Day')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /finish session/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('Delete session navigates to dashboard after confirm', async () => {
    mockDeleteSession.mockResolvedValueOnce(undefined as any);
    window.confirm = jest.fn(() => true);

    renderSessionDetail(makeSession([]));

    await waitFor(() => expect(screen.getByText('Push Day')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete session/i }));

    await waitFor(() => {
      expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Cancel delete session does nothing', async () => {
    window.confirm = jest.fn(() => false);

    renderSessionDetail(makeSession([]));

    await waitFor(() => expect(screen.getByText('Push Day')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete session/i }));

    expect(mockDeleteSession).not.toHaveBeenCalled();
  });

  it('Redirects to dashboard on session not found', async () => {
    renderSessionDetail(null);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
