/**
 * Authentication context, provider, and convenience hook.
 */

import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';
import { setLogoutCallback } from '../services/api';
import { queryClient } from '@/lib/queryClient';
import type { LoginRequest, User } from '../types/auth';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Session restore on load — reads both keys; if either is missing, start unauthenticated (Req 1.9)
    const token = localStorage.getItem('session_token');
    const storedUser = localStorage.getItem('session_user');
    if (token && storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const logout = () => {
    // Clear Query cache
    queryClient.clear();
    // Clear Zustand persist from sessionStorage
    sessionStorage.removeItem('lgts_global_date_range');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_user');
    setUser(null);
    // ProtectedRoute redirects to /login when isAuthenticated becomes false
  };

  // Wire 401 interceptor in api.ts so that expired-session responses trigger logout
  setLogoutCallback(logout);

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await authService.login(credentials);
    const loggedUser: User = {
      id: response.id,
      username: response.username,
      role: response.role,
    };
    localStorage.setItem('session_token', response.token);
    localStorage.setItem('session_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Convenience hook
// ---------------------------------------------------------------------------

/** Returns the current auth context. Must be used inside an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
