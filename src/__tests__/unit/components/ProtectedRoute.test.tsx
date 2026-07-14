/**
 * Unit tests for src/router/ProtectedRoute.tsx
 *
 * Covers:
 * - Unauthenticated (no session in localStorage) → redirects to /login, no child content rendered
 * - Authenticated (session_token + session_user in localStorage) → child content is rendered
 *
 * Requirements: 1.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../router/ProtectedRoute';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders the router with:
 *   /protected  → behind ProtectedRoute (renders a sentinel <div>)
 *   /login      → a plain "Login Page" sentinel
 *
 * `initialEntries` defaults to ['/protected'] so we always start by trying
 * to access the protected resource.
 */
function renderWithRouter(initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          {/* Protected area */}
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          {/* Login page that ProtectedRoute redirects to */}
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  // Always start from a clean localStorage state
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when unauthenticated (no session in localStorage)', () => {
    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not render child content when unauthenticated', () => {
    renderWithRouter();

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders child content when authenticated (session_token + session_user present)', () => {
    // Seed localStorage to simulate a persisted session
    localStorage.setItem('session_token', 'test-token-abc');
    localStorage.setItem(
      'session_user',
      JSON.stringify({ id: 1, username: 'testuser', email: 'test@example.com' }),
    );

    renderWithRouter();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when only session_token is present (incomplete session)', () => {
    // AuthProvider requires BOTH keys; a single key means unauthenticated
    localStorage.setItem('session_token', 'test-token-abc');

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when only session_user is present (incomplete session)', () => {
    localStorage.setItem(
      'session_user',
      JSON.stringify({ id: 1, username: 'testuser', email: 'test@example.com' }),
    );

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when session_user is malformed JSON', () => {
    localStorage.setItem('session_token', 'test-token-abc');
    localStorage.setItem('session_user', 'not-valid-json{{{');

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
