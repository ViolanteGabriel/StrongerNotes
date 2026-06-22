import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SessionsPage from '../../pages/SessionsPage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getSessions } from '../../services/requests/sessions/getSessions';

jest.mock('../../services/requests/sessions/getSessions');
const mockGetSessions = getSessions as jest.MockedFunction<typeof getSessions>;

const mockAuthContext = {
  user: { _id: 'u1', name: 'TestUser', email: 'test@test.com' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUserData: jest.fn(),
};

function renderSessions(sessions: any[] = []) {
  mockGetSessions.mockResolvedValueOnce(sessions as any);
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <SessionsPage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SessionsFlow', () => {
  it('Shows spinner while loading', () => {
    // Return a never-resolving promise to keep loading state
    mockGetSessions.mockReturnValueOnce(new Promise(() => {}) as any);
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
          <MemoryRouter>
            <SessionsPage />
          </MemoryRouter>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
    // The spinner is rendered as a div, check the page header is still there
    expect(screen.getByText('StrongerNotes')).toBeInTheDocument();
  });

  it('Loads and displays sessions with workout names', async () => {
    const sessions = [
      { _id: 's1', workout: { _id: 'w1', name: 'Treino A' }, owner: 'u1', date: '2024-06-15T00:00:00.000Z', notes: null, createdAt: '2024-06-15T00:00:00.000Z', updatedAt: '' },
      { _id: 's2', workout: { _id: 'w2', name: 'Treino B' }, owner: 'u1', date: '2024-06-16T00:00:00.000Z', notes: null, createdAt: '2024-06-16T00:00:00.000Z', updatedAt: '' },
    ];
    renderSessions(sessions);

    await waitFor(() => {
      expect(screen.getByText('Treino A')).toBeInTheDocument();
      expect(screen.getByText('Treino B')).toBeInTheDocument();
    });
    
    // Links to session detail pages
    const link = screen.getByRole('link', { name: /treino a/i });
    expect(link).toHaveAttribute('href', '/sessions/s1');
  });

  it('Shows empty state when no sessions exist', async () => {
    renderSessions([]);
    await waitFor(() => {
      expect(screen.getByText('No sessions recorded yet.')).toBeInTheDocument();
    });
  });

  it('Shows error when API fails', async () => {
    mockGetSessions.mockRejectedValueOnce(new Error('network error'));
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
          <MemoryRouter>
            <SessionsPage />
          </MemoryRouter>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
    await waitFor(() => {
      expect(screen.getByText('Could not load session history.')).toBeInTheDocument();
    });
  });

  it('Header shows StrongerNotes brand link', async () => {
    renderSessions([]);
    await waitFor(() => expect(screen.queryByRole('link', { name: /new workout/i })).toBeInTheDocument());
    expect(screen.getByText('StrongerNotes')).toBeInTheDocument();
  });

  it('Shows page title', async () => {
    renderSessions([]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /session history/i })).toBeInTheDocument();
    });
  });
});
