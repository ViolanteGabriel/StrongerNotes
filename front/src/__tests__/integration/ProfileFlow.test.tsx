import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../../pages/ProfilePage';
import { AuthContext } from '../../contexts/auth-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { updateUser } from '../../services/requests/users/updateUser';
import { deleteUser } from '../../services/requests/users/deleteUser';

jest.mock('../../services/requests/users/updateUser');
jest.mock('../../services/requests/users/deleteUser');

const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;

const mockUpdateUserData = jest.fn();
const mockLogout = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUser = { _id: 'u1', name: 'TestUser', email: 'test@test.com' };

function renderProfile(user: typeof mockUser | null = mockUser) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
        updateUserData: mockUpdateUserData,
      }}
    >
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfileFlow', () => {
  it('Loads user data into form fields on mount', async () => {
    renderProfile();
    const nameInput = screen.getByRole('textbox', { name: /full name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    expect(nameInput).toHaveValue('TestUser');
    expect(emailInput).toHaveValue('test@test.com');
  });

  it('Successful profile update calls updateUser and updateUserData', async () => {
    renderProfile();
    mockUpdateUser.mockResolvedValueOnce({
      data: { _id: 'u1', name: 'NewName', email: 'new@test.com', createdAt: '', updatedAt: '' }
    });

    const nameInput = screen.getByRole('textbox', { name: /full name/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'NewName');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith('u1', { name: 'NewName' });
      expect(mockUpdateUserData).toHaveBeenCalledWith({ name: 'NewName', email: 'new@test.com' });
      expect(screen.getByText('Changes saved successfully.')).toBeInTheDocument();
    });
  });

  it('Shows email conflict error on 409', async () => {
    renderProfile();
    const { AxiosError } = jest.requireActual('axios');
    const axiosError = new AxiosError('Conflict');
    axiosError.response = { status: 409 } as never;
    mockUpdateUser.mockRejectedValueOnce(axiosError);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'taken@test.com');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('This e-mail is already in use.')).toBeInTheDocument();
    });
  });

  it('Shows validation and generic save errors for Axios failures', async () => {
    const { AxiosError } = jest.requireActual('axios');

    renderProfile();
    const badRequest = new AxiosError('Bad Request');
    badRequest.response = { status: 400 } as never;
    mockUpdateUser.mockRejectedValueOnce(badRequest);

    const nameInput = screen.getByRole('textbox', { name: /full name/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Invalid Name');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Invalid data. Please check the fields.')).toBeInTheDocument();
  });

  it('Shows a generic save message for non-validation Axios errors', async () => {
    const { AxiosError } = jest.requireActual('axios');
    const serverError = new AxiosError('Server Error');
    serverError.response = { status: 500 } as never;
    mockUpdateUser.mockRejectedValueOnce(serverError);

    renderProfile();

    const nameInput = screen.getByRole('textbox', { name: /full name/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Server Error Name');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Could not save changes. Please try again.')).toBeInTheDocument();
  });

  it('Shows generic error on unexpected failure', async () => {
    renderProfile();
    mockUpdateUser.mockRejectedValueOnce(new Error('network fail'));

    const nameInput = screen.getByRole('textbox', { name: /full name/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Changed');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Unexpected error. Please try again.')).toBeInTheDocument();
    });
  });

  it('Shows success when no changes made', async () => {
    renderProfile();
    // Submit without changing anything – payload is empty, should still succeed
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Changes saved successfully.')).toBeInTheDocument();
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('Delete account flow calls logout and navigates home', async () => {
    mockDeleteUser.mockResolvedValueOnce(undefined as any);
    window.confirm = jest.fn(() => true);

    renderProfile();

    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('u1');
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('Cancel delete account does nothing', async () => {
    window.confirm = jest.fn(() => false);
    renderProfile();

    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('Shows delete error when account deletion fails', async () => {
    mockDeleteUser.mockRejectedValueOnce(new Error('delete failed'));
    window.confirm = jest.fn(() => true);

    renderProfile();

    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    expect(await screen.findByText('Could not delete account. Please try again.')).toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('Does not save or delete when no user is loaded', async () => {
    renderProfile(null);

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
