import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../contexts/AuthContext';

beforeEach(() => {
  jest.clearAllMocks();
});

function renderWithRouter(authenticated: boolean, isLoading = false) {
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: authenticated,
    isLoading,
    user: authenticated ? { id: '1', name: 'John', email: 'j@example.com' } : null,
    login: jest.fn(),
    logout: jest.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <div>Protected content</div>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  it('renders children when the user is authenticated', async () => {
    renderWithRouter(true);
    expect(await screen.findByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /login when the user is not authenticated', async () => {
    renderWithRouter(false);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while auth state is being resolved', () => {
    renderWithRouter(false, true);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
