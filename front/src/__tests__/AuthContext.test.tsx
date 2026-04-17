import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

jest.mock('../services/requests/auth/login', () => ({
  login: jest.fn(),
}));

import { login as loginService } from '../services/requests/auth/login';

const mockLoginResponse = {
  token: 'mock.jwt.token',
  user: { id: '123', name: 'John Doe', email: 'john@example.com' },
};

function AuthConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}

function LoginButton() {
  const { login } = useAuth();
  const handleLogin = () => login({ email: 'john@example.com', password: 'password123' });
  return <button onClick={handleLogin}>Login</button>;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('starts unauthenticated with no user when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  it('restores session from localStorage on mount', async () => {
    localStorage.setItem('auth_token', 'existing.token');
    localStorage.setItem('auth_user', JSON.stringify(mockLoginResponse.user));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user-name').textContent).toBe('John Doe');
  });

  it('sets user and stores token in localStorage after login()', async () => {
    (loginService as jest.Mock).mockResolvedValue(mockLoginResponse);

    render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user-name').textContent).toBe('John Doe');
    expect(localStorage.getItem('auth_token')).toBe('mock.jwt.token');
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toMatchObject({
      email: 'john@example.com',
    });
  });

  it('clears user and localStorage after logout()', async () => {
    localStorage.setItem('auth_token', 'existing.token');
    localStorage.setItem('auth_user', JSON.stringify(mockLoginResponse.user));

    render(
      <AuthProvider>
        <AuthConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('clears corrupted localStorage data silently on mount', async () => {
    localStorage.setItem('auth_token', 'some.token');
    localStorage.setItem('auth_user', 'not valid json {{');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
