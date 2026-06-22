import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExercisesPage from '../../pages/ExercisesPage';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/auth-context';
import { getExercises } from '../../services/requests/exercises/getExercises';
import { createExercise } from '../../services/requests/exercises/createExercise';

// Mock the entire exercises module so the barrel imports work
jest.mock('../../services/requests/exercises/getExercises');
jest.mock('../../services/requests/exercises/createExercise');

const mockGetExercises = getExercises as jest.MockedFunction<typeof getExercises>;
const mockCreateExercise = createExercise as jest.MockedFunction<typeof createExercise>;

const mockAuthContext = {
  user: { _id: '1', name: 'TestUser', email: 'test@test.com' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUserData: jest.fn(),
};

function renderExercises(exercises: any[] = []) {
  mockGetExercises.mockResolvedValueOnce(exercises as any);
  
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <ExercisesPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ExercisesFlow', () => {
  it('Renders exercises list from API', async () => {
    const exercises = [
      { _id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', category: 'strength', isCustom: false, createdBy: null },
      { _id: 'e2', name: 'Squat', muscleGroup: 'Quadriceps', category: 'strength', isCustom: false, createdBy: null },
    ];
    renderExercises(exercises);

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getAllByText('Chest').length).toBeGreaterThan(0);
      expect(screen.getByText('Squat')).toBeInTheDocument();
      expect(screen.getAllByText('Quadriceps').length).toBeGreaterThan(0);
    });
  });

  it('Shows empty state when no exercises match filters', async () => {
    renderExercises([]);
    await waitFor(() => {
      expect(screen.getByText('No exercises match your filters.')).toBeInTheDocument();
    });
  });

  it('Shows total exercise count', async () => {
    const exercises = [
      { _id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', category: 'strength', isCustom: false, createdBy: null },
    ];
    renderExercises(exercises);

    await waitFor(() => {
      expect(screen.getByText('1 exercise shown')).toBeInTheDocument();
    });
  });

  it('Create exercise flow', async () => {
    renderExercises([]);
    mockCreateExercise.mockResolvedValueOnce({
      _id: 'e3',
      name: 'Cable Fly',
      muscleGroup: 'Chest',
      category: 'strength',
      isCustom: true,
      createdBy: '1',
    });
    
    await waitFor(() => expect(screen.queryByText('No exercises match your filters.')).toBeInTheDocument());

    // Click New Exercise button
    await userEvent.click(screen.getByRole('button', { name: /new exercise/i }));
    
    const nameInput = screen.getByPlaceholderText('e.g. Cable Fly');
    await userEvent.type(nameInput, 'Cable Fly');
    
    const muscleInput = screen.getByPlaceholderText('e.g. Chest');
    await userEvent.type(muscleInput, 'Chest');

    await userEvent.click(screen.getByRole('button', { name: /create exercise/i }));

    await waitFor(() => {
      expect(mockCreateExercise).toHaveBeenCalledWith({
        name: 'Cable Fly',
        category: 'strength',
        muscleGroup: 'Chest',
      });
      expect(screen.getByText('Cable Fly')).toBeInTheDocument();
    });
  });

  it('Filter by muscle group pill', async () => {
    const exercises = [
      { _id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', category: 'strength', isCustom: false, createdBy: null },
      { _id: 'e2', name: 'Squat', muscleGroup: 'Quadriceps', category: 'strength', isCustom: false, createdBy: null },
    ];
    renderExercises(exercises);

    await waitFor(() => expect(screen.getByText('Bench Press')).toBeInTheDocument());

    // Click "Chest" muscle filter
    const chestBtn = screen.getByRole('button', { name: 'Chest' });
    await userEvent.click(chestBtn);

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.queryByText('Squat')).not.toBeInTheDocument();
    
    // Reset to All
    const allBtn = screen.getAllByRole('button', { name: 'All' })[1];
    await userEvent.click(allBtn);
    
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  it('Filter by category (strength/cardio)', async () => {
    const exercises = [
      { _id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', category: 'strength', isCustom: false, createdBy: null },
      { _id: 'e2', name: 'Run', muscleGroup: 'Full Body', category: 'cardio', isCustom: false, createdBy: null },
    ];
    renderExercises(exercises);

    await waitFor(() => expect(screen.getByText('Bench Press')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /cardio/i }));

    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('Form validation: shows error when name is empty', async () => {
    renderExercises([]);

    await waitFor(() => expect(screen.queryByText('No exercises match your filters.')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /new exercise/i }));
    // Don't fill in name
    await userEvent.click(screen.getByRole('button', { name: /create exercise/i }));

    expect(screen.getByText('Exercise name is required.')).toBeInTheDocument();
    expect(mockCreateExercise).not.toHaveBeenCalled();
  });

  it('Cancel create form', async () => {
    renderExercises([]);

    await waitFor(() => expect(screen.queryByText('No exercises match your filters.')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /new exercise/i }));
    expect(screen.getByPlaceholderText('e.g. Cable Fly')).toBeInTheDocument();

    // Click "Cancel" (same button toggles)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByPlaceholderText('e.g. Cable Fly')).not.toBeInTheDocument();
  });
});
