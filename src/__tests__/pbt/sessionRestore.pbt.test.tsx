/**
 * Property-Based Test: Session Token Round-Trip Restoration
 *
 * Feature: lgts-platform, Property 2: Session Token Round-Trip Restoration
 * Arbitrary: fc.string({ minLength: 1 }) for token,
 *            fc.record({ id, username, displayName }) for user (all strings minLength: 1)
 * Pre-populate localStorage with session_token and session_user (JSON-stringified user);
 * mount AuthProvider; assert isAuthenticated === true and user matches.
 *
 * Validates: Requirements 1.9
 */

import { describe, it, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// ---------------------------------------------------------------------------
// Helper: consumer component that exposes auth state via data attributes
// ---------------------------------------------------------------------------

function AuthStateReader() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div
      data-testid="auth-state"
      data-is-authenticated={String(isAuthenticated)}
      data-user={user ? JSON.stringify(user) : ''}
    />
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbitraryToken = fc.string({ minLength: 1 });

const arbitraryUser = fc.record({
  id: fc.string({ minLength: 1 }),
  username: fc.string({ minLength: 1 }),
  displayName: fc.string({ minLength: 1 }),
});

// ---------------------------------------------------------------------------
// Cleanup — always clear localStorage between property runs
// ---------------------------------------------------------------------------

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 2 — Session Token Round-Trip Restoration', () => {
  it(
    'AuthProvider restores isAuthenticated=true when both session_token and session_user are present',
    () => {
      fc.assert(
        fc.property(arbitraryToken, arbitraryUser, (token, user) => {
          // 1. Pre-populate localStorage (simulates a previously-logged-in session)
          localStorage.setItem('session_token', token);
          localStorage.setItem('session_user', JSON.stringify(user));

          // 2. Mount AuthProvider with the reader child
          const { unmount } = render(
            <AuthProvider>
              <AuthStateReader />
            </AuthProvider>,
          );

          // 3. Assert isAuthenticated is true
          const el = screen.getByTestId('auth-state');
          const isAuthenticated = el.getAttribute('data-is-authenticated') === 'true';

          // 4. Cleanup before next run
          unmount();
          localStorage.clear();

          return isAuthenticated;
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'AuthProvider restores user object that matches the pre-populated session_user',
    () => {
      fc.assert(
        fc.property(arbitraryToken, arbitraryUser, (token, user) => {
          localStorage.setItem('session_token', token);
          localStorage.setItem('session_user', JSON.stringify(user));

          const { unmount } = render(
            <AuthProvider>
              <AuthStateReader />
            </AuthProvider>,
          );

          const el = screen.getByTestId('auth-state');
          const rawUser = el.getAttribute('data-user') ?? '';
          let restoredUser: unknown = null;
          try {
            restoredUser = JSON.parse(rawUser);
          } catch {
            // parse failure counts as property violation
          }

          unmount();
          localStorage.clear();

          if (!restoredUser || typeof restoredUser !== 'object') return false;
          const u = restoredUser as Record<string, unknown>;
          return (
            u['id'] === user.id &&
            u['username'] === user.username &&
            u['displayName'] === user.displayName
          );
        }),
        { numRuns: 100 },
      );
    },
  );
});
