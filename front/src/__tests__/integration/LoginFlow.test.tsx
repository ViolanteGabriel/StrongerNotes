import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthContext } from '../../contexts/auth-context';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLoginFlow() {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: mockLogin,
        logout: jest.fn(),
        updateUserData: jest.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginFlow', () => {
  it('toggles password visibility and navigates after a successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginFlow();

    const password = screen.getByLabelText(/^password$/i);
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(password).toHaveAttribute('type', 'text');

    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(password, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows expected messages for auth and unexpected failures', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const unauthorized = new AxiosError('Unauthorized');
    unauthorized.response = { status: 401 } as never;
    mockLogin.mockRejectedValueOnce(unauthorized);

    const { unmount } = renderLoginFlow();

    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid e-?mail or password/i)).toBeInTheDocument();
    unmount();

    mockLogin.mockRejectedValueOnce(new Error('Boom'));
    renderLoginFlow();

    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/unexpected error/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
