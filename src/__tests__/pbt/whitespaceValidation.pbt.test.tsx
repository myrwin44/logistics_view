/**
 * Property-Based Test: Whitespace Input Rejection
 *
 * Feature: lgts-platform, Property 3: Whitespace Input Rejection
 * Arbitrary: fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')) for field value
 * Submit whitespace-only username or whitespace-only password → assert inline
 * validation error shown and no fetch dispatched.
 *
 * Validates: Requirements 1.3, 11.3
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../pages/Login';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function submitForm(username: string, password: string) {
  const usernameInput = screen.getByLabelText(/username/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });

  fireEvent.change(usernameInput, { target: { value: username } });
  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.click(submitButton);
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Produces strings containing only whitespace characters (space, tab, newline, carriage return).
// Note: fc.stringOf can produce empty strings too — the Login component treats both
// empty and whitespace-only values as invalid (`.trim()` returns '' for both).
const arbitraryWhitespaceString = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'));

// A non-empty non-whitespace string to use as the valid field counterpart
const arbitraryNonBlankString = fc.string({ minLength: 1 }).filter(
  (s) => s.trim().length > 0,
);

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  // Mock fetch globally so we can assert it was never called
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 3 — Whitespace Input Rejection', () => {
  it(
    'shows username validation error and does not call fetch when username is blank/whitespace',
    () => {
      fc.assert(
        fc.property(
          arbitraryWhitespaceString,
          arbitraryNonBlankString,
          (wsUsername, validPassword) => {
            renderLogin();

            submitForm(wsUsername, validPassword);

            // Inline validation error for username must be present
            const usernameError = screen.queryByText('Username is required');
            const usernameErrorPresent = usernameError !== null;

            // fetch must NOT have been called
            const fetchNotCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.length === 0;

            cleanup();
            vi.mocked(fetch).mockClear();

            return usernameErrorPresent && fetchNotCalled;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'shows password validation error and does not call fetch when password is blank/whitespace',
    () => {
      fc.assert(
        fc.property(
          arbitraryNonBlankString,
          arbitraryWhitespaceString,
          (validUsername, wsPassword) => {
            renderLogin();

            submitForm(validUsername, wsPassword);

            // Inline validation error for password must be present
            const passwordError = screen.queryByText('Password is required');
            const passwordErrorPresent = passwordError !== null;

            // fetch must NOT have been called
            const fetchNotCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.length === 0;

            cleanup();
            vi.mocked(fetch).mockClear();

            return passwordErrorPresent && fetchNotCalled;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'shows both username and password validation errors and does not call fetch when both fields are blank/whitespace',
    () => {
      fc.assert(
        fc.property(
          arbitraryWhitespaceString,
          arbitraryWhitespaceString,
          (wsUsername, wsPassword) => {
            renderLogin();

            submitForm(wsUsername, wsPassword);

            // Both inline validation errors must be present
            const usernameError = screen.queryByText('Username is required');
            const passwordError = screen.queryByText('Password is required');
            const bothErrorsPresent = usernameError !== null && passwordError !== null;

            // fetch must NOT have been called
            const fetchNotCalled = (fetch as ReturnType<typeof vi.fn>).mock.calls.length === 0;

            cleanup();
            vi.mocked(fetch).mockClear();

            return bothErrorsPresent && fetchNotCalled;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
