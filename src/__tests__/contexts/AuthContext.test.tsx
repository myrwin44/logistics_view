import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authServiceModule from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock queryClient
vi.mock('../../lib/queryClient', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

describe('contexts/AuthContext - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Restore', () => {
    it('should restore session when localStorage has valid session_token and session_user', () => {
      localStorage.setItem('session_token', 'test-token');
      localStorage.setItem('session_user', JSON.stringify({ id: '123', username: 'testuser', role: 'admin' }));

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: '123', username: 'testuser', role: 'admin' });
    });

    it('should not restore session when session_token is missing', () => {
      localStorage.setItem('session_user', JSON.stringify({ id: '123', username: 'testuser', role: 'admin' }));

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should not restore session when session_user is invalid JSON', () => {
      localStorage.setItem('session_token', 'test-token');
      localStorage.setItem('session_user', 'invalid-json{');

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Login', () => {
    it('should save session_token and session_user to localStorage on successful login', async () => {
      const mockLoginResponse = {
        id: '456',
        username: 'newuser',
        role: 'user',
        token: 'new-token',
      };

      vi.mocked(authServiceModule.authService.login).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      await act(async () => {
        await result.current.login({ username: 'newuser', password: 'password123' });
      });

      await waitFor(() => {
        expect(localStorage.getItem('session_token')).toBe('new-token');
        const storedUser = JSON.parse(localStorage.getItem('session_user')!);
        expect(storedUser).toEqual({ id: '456', username: 'newuser', role: 'user' });
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Logout', () => {
    it('should clear session_token and session_user from localStorage on logout', () => {
      localStorage.setItem('session_token', 'test-token');
      localStorage.setItem('session_user', JSON.stringify({ id: '123', username: 'testuser', role: 'admin' }));

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('session_token')).toBeNull();
      expect(localStorage.getItem('session_user')).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should clear lgts_global_date_range from sessionStorage on logout', () => {
      sessionStorage.setItem('lgts_global_date_range', JSON.stringify({ startDate: '2024-01-01', endDate: '2024-12-31' }));
      localStorage.setItem('session_token', 'test-token');
      localStorage.setItem('session_user', JSON.stringify({ id: '123', username: 'testuser', role: 'admin' }));

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      act(() => {
        result.current.logout();
      });

      expect(sessionStorage.getItem('lgts_global_date_range')).toBeNull();
    });
  });

  describe('useAuth hook validation', () => {
    it('should throw Error with "AuthProvider" when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow(/AuthProvider/);
    });
  });
});
