/**
 * Unit tests for AuthContext (AuthProvider + useAuth).
 * Requirements: 1.2, 1.7, 1.9
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import type { LoginResponse, User } from '../../../types/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
  id: '42',
  username: 'testuser',
  role: 'admin',
};

const MOCK_TOKEN = 'mock-jwt-token';

const MOCK_LOGIN_RESPONSE: LoginResponse = {
  id: MOCK_USER.id,
  username: MOCK_USER.username,
  role: MOCK_USER.role,
  token: MOCK_TOKEN,
};

/** Renders the hook wrapped in AuthProvider. */
function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    ),
  });
}

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

describe('AuthContext', () => {
  describe('Session restore on mount', () => {
    it('restores session when both session_token and session_user are in localStorage', () => {
      localStorage.setItem('session_token', MOCK_TOKEN);
      localStorage.setItem('session_user', JSON.stringify(MOCK_USER));

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(MOCK_USER);
    });

    it('does not restore session when localStorage is empty', () => {
      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('does not restore session when only session_token is present', () => {
      localStorage.setItem('session_token', MOCK_TOKEN);

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('does not restore session when only session_user is present', () => {
      localStorage.setItem('session_user', JSON.stringify(MOCK_USER));

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login()', () => {
    it('sets isAuthenticated and user after successful login', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue(MOCK_LOGIN_RESPONSE);

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'secret' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(MOCK_USER);
    });

    it('stores token and user in localStorage after login', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue(MOCK_LOGIN_RESPONSE);

      const { result } = renderAuthHook();

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'secret' });
      });

      expect(localStorage.getItem('session_token')).toBe(MOCK_TOKEN);
      expect(JSON.parse(localStorage.getItem('session_user')!)).toEqual(MOCK_USER);
    });
  });

  describe('logout()', () => {
    it('clears isAuthenticated and user after logout', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue(MOCK_LOGIN_RESPONSE);

      const { result } = renderAuthHook();

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'secret' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('removes session_token and session_user from localStorage after logout', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue(MOCK_LOGIN_RESPONSE);

      const { result } = renderAuthHook();

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'secret' });
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('session_token')).toBeNull();
      expect(localStorage.getItem('session_user')).toBeNull();
    });

    it('clears localStorage when logging out from a restored session', () => {
      localStorage.setItem('session_token', MOCK_TOKEN);
      localStorage.setItem('session_user', JSON.stringify(MOCK_USER));

      const { result } = renderAuthHook();
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('session_token')).toBeNull();
      expect(localStorage.getItem('session_user')).toBeNull();
    });
  });
});
