/**
 * Property-Based Test: Protected Route Authentication Guard
 *
 * Feature: lgts-platform, Property 1: Protected Route Authentication Guard
 * Arbitrary: fc.constantFrom(...protectedPaths) for route
 * For any protected path rendered without auth → redirect to /login,
 * child content is NOT rendered.
 *
 * Validates: Requirements 1.6
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from '../../router/ProtectedRoute';

const protectedPaths = ['/', '/schedule', '/transport-trips', '/bills', '/settings'] as const;

const CHILD_TEST_ID = 'protected-child-content';
const CHILD_TEXT = 'SECRET PROTECTED CONTENT';

function ChildPage() {
  return <div data-testid={CHILD_TEST_ID}>{CHILD_TEXT}</div>
}

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          {/* The protected subtree — any path goes through ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            {protectedPaths.map((p) => (
              <Route key={p} path={p} element={<ChildPage />} />
            ))}
          </Route>
          {/* Login page stub so the redirect target is resolvable */}
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Property 1 — Protected Route Authentication Guard', () => {
  beforeEach(() => {
    // Ensure no session data exists — unauthenticated state
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_user');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('redirects to /login and does not render child content for any protected path when unauthenticated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...protectedPaths),
        (path) => {
          renderAtPath(path);

          // The login page stub must be visible — redirect happened
          const loginPage = screen.queryByTestId('login-page');
          const childContent = screen.queryByTestId(CHILD_TEST_ID);

          const redirected = loginPage !== null;
          const childNotRendered = childContent === null;

          // Clean up inside the property so each run starts fresh
          cleanup();

          return redirected && childNotRendered;
        },
      ),
      { numRuns: 50 },
    );
  });
});
