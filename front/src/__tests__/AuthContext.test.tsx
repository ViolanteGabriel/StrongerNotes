import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/auth-context';

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
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}

function LoginButton() {
  const { login } = useAuth();
  const handleLogin = async () => {
    await login({ email: 'john@example.com', password: 'password123' });
  };
  return <button onClick={handleLogin}>Login</button>;
}

function UpdateUserButton() {
  const { updateUserData } = useAuth();
  return <button onClick={() => updateUserData({ name: 'Jane Updated' })}>Update user</button>;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('throws when useAuth is rendered outside its provider', () => {
    function MissingProviderConsumer() {
      useAuth();
      return <div>auth</div>;
    }

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<MissingProviderConsumer />)).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

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
    const originalConsoleError = console.error;
    const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('The current testing environment is not configured to support act')
      ) {
        return;
      }
      originalConsoleError(...args);
    });
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
    consoleError.mockRestore();
  });

  it('normalizes login responses that already use _id', async () => {
    (loginService as jest.Mock).mockResolvedValue({
      token: 'mock.jwt.token',
      user: { _id: 'abc123', name: 'Jane Doe', email: 'jane@example.com' },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByTestId('user-name').textContent).toBe('Jane Doe');
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toMatchObject({
      _id: 'abc123',
      email: 'jane@example.com',
    });
  });

  it('rejects login responses without a user id', async () => {
    (loginService as jest.Mock).mockResolvedValue({
      token: 'mock.jwt.token',
      user: { name: 'No Id', email: 'missing-id@example.com' },
    });

    function InvalidLoginButton() {
      const { login } = useAuth();
      const [error, setError] = useState('');
      return (
        <>
          <button
            onClick={() => login({ email: 'john@example.com', password: 'password123' }).catch((err) => {
              setError(err instanceof Error ? err.message : 'unknown');
            })}
          >
            Invalid login
          </button>
          <span data-testid="login-error">{error}</span>
        </>
      );
    }

    render(
      <AuthProvider>
        <AuthConsumer />
        <InvalidLoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Invalid login' }));
    await waitFor(() => expect(screen.getByTestId('login-error').textContent).toBe('Invalid user payload'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(localStorage.getItem('auth_token')).toBeNull();
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

  it('updates the current user data in state and localStorage', async () => {
    localStorage.setItem('auth_token', 'existing.token');
    localStorage.setItem('auth_user', JSON.stringify(mockLoginResponse.user));

    render(
      <AuthProvider>
        <AuthConsumer />
        <UpdateUserButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await userEvent.click(screen.getByRole('button', { name: 'Update user' }));

    expect(screen.getByTestId('user-name').textContent).toBe('Jane Updated');
    expect(screen.getByTestId('user-email').textContent).toBe('john@example.com');
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toMatchObject({
      name: 'Jane Updated',
      email: 'john@example.com',
    });
  });

  it('ignores user updates while signed out', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
        <UpdateUserButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Update user' }));

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
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
