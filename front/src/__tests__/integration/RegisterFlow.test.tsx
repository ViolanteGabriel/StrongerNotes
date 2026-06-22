import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AxiosError } from 'axios';
import RegisterPage from '../../pages/RegisterPage';
import { createUser } from '../../services/requests/users/createUser';
import { useAuth } from '../../contexts/auth-context';

jest.mock('../../services/requests/users/createUser');
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

jest.mock('../../contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    login: mockLogin,
  });
});

describe('RegisterFlow', () => {
  it('renders all required fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('Successful registration flow and auto-login', async () => {
    mockCreateUser.mockResolvedValueOnce({ data: { id: '1', name: 'Test User', email: 'test@test.com' } } as any);
    mockLogin.mockResolvedValueOnce(undefined);

    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Conflict error shows correct message', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const axiosError = new AxiosError('Conflict');
    axiosError.response = { status: 409 } as never;
    mockCreateUser.mockRejectedValueOnce(axiosError);

    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText('This e-mail is already registered.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error creating user:', axiosError);
    consoleError.mockRestore();
  });

  it('Generic server error shows fallback message', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('fail');
    mockCreateUser.mockRejectedValueOnce(error);

    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText('Unexpected error. Please try again.')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Error creating user:', error);
    consoleError.mockRestore();
  });

  it('Password visibility toggle works correctly', async () => {
    renderRegister();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle button has aria-label "Show password" initially
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');

    // After clicking again, it should go back to password and label changes to "Hide password"
    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    await userEvent.click(hideBtn);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('Has link to sign in page', () => {
    renderRegister();
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('Shows submitting state when form is submitted', async () => {
    // Mock a delayed response
    mockCreateUser.mockReturnValueOnce(new Promise(() => {}) as any);
    mockLogin.mockResolvedValueOnce(undefined);

    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });
});
