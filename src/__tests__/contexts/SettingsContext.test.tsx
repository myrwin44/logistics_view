import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import * as settingsServiceModule from '../../services/settingsService';
import type { UserSettings } from '../../types/settings';

// Mock settingsService
vi.mock('../../services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('contexts/SettingsContext - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load with Cache', () => {
    it('should initialize from cache when localStorage has valid settings_cache', async () => {
      const cachedSettings: UserSettings = {
        displayName: 'Cached User',
        username: 'cached',
        dateFormat: 'DD/MM/YYYY',
        defaultDateRange: 'last7',
      };
      localStorage.setItem('settings_cache', JSON.stringify(cachedSettings));

      vi.mocked(settingsServiceModule.settingsService.getSettings).mockResolvedValue({
        ...cachedSettings,
        displayName: 'Server User',
      });

      const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

      // Initial state from cache
      expect(result.current.displayName).toBe('Cached User');
      expect(result.current.dateFormat).toBe('DD/MM/YYYY');

      // Wait for API to return
      await waitFor(() => {
        expect(result.current.displayName).toBe('Server User');
      });
    });
  });

  describe('API Fetch', () => {
    it('should update state and cache when API getSettings succeeds', async () => {
      const serverSettings: UserSettings = {
        displayName: 'Server User',
        username: 'server',
        dateFormat: 'YYYY-MM-DD',
        defaultDateRange: 'last30',
      };

      vi.mocked(settingsServiceModule.settingsService.getSettings).mockResolvedValue(serverSettings);

      const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

      await waitFor(() => {
        expect(result.current.displayName).toBe('Server User');
        expect(result.current.dateFormat).toBe('YYYY-MM-DD');
      });

      const cached = JSON.parse(localStorage.getItem('settings_cache')!);
      expect(cached).toEqual(serverSettings);
    });
  });

  describe('Optimistic Update', () => {
    it('should update UI immediately before API completes', async () => {
      const initialSettings: UserSettings = {
        displayName: 'Initial',
        username: 'user',
        dateFormat: 'YYYY-MM-DD',
        defaultDateRange: 'last30',
      };

      vi.mocked(settingsServiceModule.settingsService.getSettings).mockResolvedValue(initialSettings);
      vi.mocked(settingsServiceModule.settingsService.updateSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...initialSettings, displayName: 'Updated' }), 100))
      );

      const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

      await waitFor(() => expect(result.current.displayName).toBe('Initial'));

      act(() => {
        result.current.updateSettings({ displayName: 'Optimistic' });
      });

      // Optimistic update applied immediately
      expect(result.current.displayName).toBe('Optimistic');

      // Wait for API to complete
      await waitFor(() => {
        expect(result.current.displayName).toBe('Updated');
      });
    });
  });

  describe('Rollback on Failure', () => {
    it('should rollback state and cache when API updateSettings fails', async () => {
      const initialSettings: UserSettings = {
        displayName: 'Original',
        username: 'user',
        dateFormat: 'YYYY-MM-DD',
        defaultDateRange: 'last30',
      };

      vi.mocked(settingsServiceModule.settingsService.getSettings).mockResolvedValue(initialSettings);
      vi.mocked(settingsServiceModule.settingsService.updateSettings).mockRejectedValue(new Error('API failed'));

      const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

      await waitFor(() => expect(result.current.displayName).toBe('Original'));

      await act(async () => {
        try {
          await result.current.updateSettings({ displayName: 'Failed Update' });
        } catch {
          // Expected error
        }
      });

      // State rolled back
      expect(result.current.displayName).toBe('Original');

      // Cache rolled back
      const cached = JSON.parse(localStorage.getItem('settings_cache')!);
      expect(cached.displayName).toBe('Original');
    });
  });

  describe('useSettings hook validation', () => {
    it('should throw Error when used outside provider', () => {
      expect(() => {
        renderHook(() => useSettings());
      }).toThrow(/SettingsProvider/);
    });
  });
});
