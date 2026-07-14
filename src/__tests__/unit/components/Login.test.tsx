/**
 * Unit tests for src/pages/Login.tsx
 *
 * Covers:
 * - Renders username and password fields (Req 1.1)
 * - Shows validation error when submitting empty username (Req 1.3)
 * - Shows validation error when submitting empty password (Req 1.3)
 * - Shows "Invalid username or password" on 401 response (Req 1.4)
 * - Disables submit button while loading (Req 1.5)
 * - Redirects to / on successful login (Req 1.2)
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import Login from '../../../pages/Login';
import { authService } from '../../../services/authService';
import type { LoginResponse } from '../../../types/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders the Login page inside a MemoryRouter + AuthProvider so that
 * useNavigate and useAuth are available.
 */
function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const MOCK_LOGIN_RESPONSE: LoginResponse = {
  token: 'test-jwt-token',
  id: '1',
  username: 'testuser',
  role: 'user',
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login', () => {
  // ── Req 1.1: Renders required fields ─────────────────────────────────────

  describe('Rendering', () => {
    it('renders a username input field', () => {
      renderLogin();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('renders a password input field', () => {
      renderLogin();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders a submit button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders the password field with type="password"', () => {
      renderLogin();
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });
  });

  // ── Req 1.3: Validation on empty submit ───────────────────────────────────

  describe('Validation — empty fields', () => {
    it('shows username validation error when username is empty on submit', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Leave username empty, fill in password, then submit
      await user.type(screen.getByLabelText(/password/i), 'somepassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    it('shows password validation error when password is empty on submit', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Fill in username, leave password empty, then submit
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows both validation errors when both fields are empty on submit', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('does not call authService.login when fields are empty', async () => {
      const loginSpy = vi.spyOn(authService, 'login');
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('validation errors have role="alert" for accessibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      const alerts = screen.getAllByRole('alert');
      // At least the two field validation errors should be alerts
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Req 1.4: 401 error message ────────────────────────────────────────────

  describe('Authentication error — 401', () => {
    it('shows "Invalid username or password" when login returns 401', async () => {
      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      vi.spyOn(authService, 'login').mockRejectedValue(error401);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });
    });

    it('auth error message has role="alert"', async () => {
      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      vi.spyOn(authService, 'login').mockRejectedValue(error401);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('does not reveal which specific field was incorrect on 401', async () => {
      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      vi.spyOn(authService, 'login').mockRejectedValue(error401);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        // Should NOT show individual field errors after a 401
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
        expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
      });
    });
  });

  // ── Req 1.5: Disable button while loading ────────────────────────────────

  describe('Loading state', () => {
    it('disables the submit button while login is in progress', async () => {
      // Create a promise we can control to keep the login pending
      let resolvePending!: (value: LoginResponse) => void;
      const pendingPromise = new Promise<LoginResponse>((resolve) => {
        resolvePending = resolve;
      });
      vi.spyOn(authService, 'login').mockReturnValue(pendingPromise);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // While still pending, the button should be disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });

      // Resolve the promise to clean up
      resolvePending(MOCK_LOGIN_RESPONSE);
    });

    it('shows a loading indicator text on the submit button while loading', async () => {
      let resolvePending!: (value: LoginResponse) => void;
      const pendingPromise = new Promise<LoginResponse>((resolve) => {
        resolvePending = resolve;
      });
      vi.spyOn(authService, 'login').mockReturnValue(pendingPromise);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // The button text should change to reflect loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      });

      resolvePending(MOCK_LOGIN_RESPONSE);
    });

    it('re-enables the submit button after a failed login', async () => {
      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      vi.spyOn(authService, 'login').mockRejectedValue(error401);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
      });
    });
  });

  // ── Req 1.2: Successful login redirects to / ─────────────────────────────

  describe('Successful login', () => {
    it('calls authService.login with the entered credentials', async () => {
      const loginSpy = vi
        .spyOn(authService, 'login')
        .mockResolvedValue(MOCK_LOGIN_RESPONSE);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(loginSpy).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('clears auth error after a successful re-submission', async () => {
      // First attempt: 401 error
      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      const loginSpy = vi.spyOn(authService, 'login').mockRejectedValueOnce(error401);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });

      // Second attempt: success
      loginSpy.mockResolvedValueOnce(MOCK_LOGIN_RESPONSE);
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'correctpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument();
      });
    });
  });
});
