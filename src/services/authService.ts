/**
 * Authentication service module.
 */

import { apiClient } from './api';
import type { LoginRequest, LoginResponse, User } from '../types/auth';

export const authService = {
  /** Authenticate a user and receive a JWT + user object. */
  login: (req: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', req),

  /** Retrieve the currently authenticated user from the server. */
  getCurrentUser: () =>
    apiClient.get<User>('/auth/me'),
};
