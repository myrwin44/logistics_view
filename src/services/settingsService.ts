/**
 * User settings service module.
 */

import { apiClient } from './api';
import type { UserSettings } from '../types/settings';

export const settingsService = {
  /** Fetch the current user's settings. */
  getSettings: () =>
    apiClient.get<UserSettings>('/settings'),

  /** Partially update the current user's settings. */
  updateSettings: (settings: Partial<UserSettings>) =>
    apiClient.patch<UserSettings>('/settings', settings),
};
