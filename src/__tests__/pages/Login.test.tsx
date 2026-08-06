import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as AuthContextModule from '../../contexts/AuthContext';

// Mock useAuth
vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogin = vi.fn();

function renderLogin() {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    isAuthenticated: false,
    user: null,
    login: mockLogin,
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('pages/Login - Component Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render username input, password input, and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('should show username error when form submitted with empty username', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    // Check specifically by id to avoid ambiguity with multiple alerts
    await waitFor(() => {
      const usernameError = document.getElementById('username-error');
      expect(usernameError).toBeTruthy();
      expect(usernameError!.textContent).toBeTruthy();
    });
  });

  it('should show password error when form submitted with empty password', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'someuser');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      const passwordError = document.getElementById('password-error');
      expect(passwordError).toBeTruthy();
    });
  });

  it('should call login with correct credentials when form is valid', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.type(screen.getByLabelText(/password/i), 'validpass');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'validuser',
        password: 'validpass',
      });
    });
  });

  it('should show auth-error on 401 login failure', async () => {
    const user = userEvent.setup();
    const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockLogin.mockRejectedValue(error401);
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      const authError = document.getElementById('auth-error');
      expect(authError).toBeTruthy();
      expect(authError!.textContent).toContain('không hợp lệ');
    });
  });

  it('should show generic auth-error on non-401 failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network error'));
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.type(screen.getByLabelText(/password/i), 'anypass');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      const authError = document.getElementById('auth-error');
      expect(authError).toBeTruthy();
      expect(authError!.textContent).toBeTruthy();
    });
  });

  it('should disable submit button while login is in progress', async () => {
    const user = userEvent.setup();
    // Never resolves — simulates in-flight request
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.type(screen.getByLabelText(/password/i), 'validpass');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /đang đăng nhập/i });
      expect(btn).toBeDisabled();
    });
  });

  it('should clear username field error when user starts typing', async () => {
    const user = userEvent.setup();
    renderLogin();

    // Trigger validation errors first
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(document.getElementById('username-error')).toBeTruthy();
    });

    // Start typing in username — error should clear
    await user.type(screen.getByLabelText(/username/i), 'a');

    await waitFor(() => {
      expect(document.getElementById('username-error')).toBeNull();
    });
  });
});
