/**
 * Unit tests for src/contexts/SettingsContext.tsx
 *
 * Covers:
 * - Initial state from localStorage cache (Req 11.5)
 * - Default values when no cache is present
 * - API fetch on mount updates state and refreshes cache (Req 11.5)
 * - updateSettings: optimistic update, localStorage write, API call (Req 11.2, 11.4)
 * - updateSettings: rollback on API failure (Req 11.4)
 * - useSettings throws outside of provider
 *
 * Requirements: 11.2, 11.4, 11.5, 3.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SettingsProvider, useSettings } from '../../../contexts/SettingsContext';
import { settingsService } from '../../../services/settingsService';
import type { UserSettings } from '../../../types/settings';

// ---------------------------------------------------------------------------
// Mock the settings service
// ---------------------------------------------------------------------------

vi.mock('../../../services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

const mockGetSettings = settingsService.getSettings as ReturnType<typeof vi.fn>;
const mockUpdateSettings = settingsService.updateSettings as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LS_KEY = 'settings_cache';

const defaultSettings: UserSettings = {
  displayName: 'Test User',
  username: 'testuser',
  dateFormat: 'YYYY-MM-DD',
  defaultDateRange: 'last30',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsProvider — initial state', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses default dateFormat and defaultDateRange when no cache and API pending', async () => {
    // API never resolves during this test
    mockGetSettings.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.dateFormat).toBe('YYYY-MM-DD');
    expect(result.current.defaultDateRange).toBe('last30');
    expect(result.current.isLoading).toBe(true);
  });

  it('uses cached values from localStorage immediately (Req 11.5)', async () => {
    const cached: UserSettings = {
      ...defaultSettings,
      dateFormat: 'DD/MM/YYYY',
      defaultDateRange: 'last7',
    };
    localStorage.setItem(LS_KEY, JSON.stringify(cached));

    // API never resolves during this test
    mockGetSettings.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSettings(), { wrapper });

    // Instant read — no await needed
    expect(result.current.dateFormat).toBe('DD/MM/YYYY');
    expect(result.current.defaultDateRange).toBe('last7');
  });

  it('fetches from API on mount and updates state (Req 11.5)', async () => {
    const fetched: UserSettings = {
      ...defaultSettings,
      dateFormat: 'MM/DD/YYYY',
      defaultDateRange: 'last90',
    };
    mockGetSettings.mockResolvedValue(fetched);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.dateFormat).toBe('MM/DD/YYYY');
    expect(result.current.defaultDateRange).toBe('last90');
  });

  it('writes API response to localStorage cache (Req 11.5)', async () => {
    const fetched: UserSettings = {
      ...defaultSettings,
      dateFormat: 'MM/DD/YYYY',
      defaultDateRange: 'last7',
    };
    mockGetSettings.mockResolvedValue(fetched);

    renderHook(() => useSettings(), { wrapper });

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')).toMatchObject({
        dateFormat: 'MM/DD/YYYY',
        defaultDateRange: 'last7',
      })
    );
  });

  it('sets isLoading=false even when API fails', async () => {
    mockGetSettings.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe('SettingsProvider — updateSettings (Req 11.2, 11.4)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: API fetch resolves with default settings
    mockGetSettings.mockResolvedValue(defaultSettings);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('applies patch to in-memory state immediately (optimistic update)', async () => {
    const updated: UserSettings = { ...defaultSettings, dateFormat: 'DD/MM/YYYY' };
    mockUpdateSettings.mockResolvedValue(updated);

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ dateFormat: 'DD/MM/YYYY' });
    });

    expect(result.current.dateFormat).toBe('DD/MM/YYYY');
  });

  it('writes updated settings to localStorage', async () => {
    const updated: UserSettings = { ...defaultSettings, defaultDateRange: 'currentMonth' };
    mockUpdateSettings.mockResolvedValue(updated);

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ defaultDateRange: 'currentMonth' });
    });

    const cached = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
    expect(cached.defaultDateRange).toBe('currentMonth');
  });

  it('calls settingsService.updateSettings with the patch', async () => {
    const updated: UserSettings = { ...defaultSettings, dateFormat: 'MM/DD/YYYY' };
    mockUpdateSettings.mockResolvedValue(updated);

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ dateFormat: 'MM/DD/YYYY' });
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ dateFormat: 'MM/DD/YYYY' });
  });

  it('rolls back in-memory state on API failure (Req 11.4)', async () => {
    mockUpdateSettings.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Original values before update
    const originalFormat = result.current.dateFormat;

    await act(async () => {
      await result.current.updateSettings({ dateFormat: 'DD/MM/YYYY' }).catch(() => {});
    });

    // Should have rolled back
    expect(result.current.dateFormat).toBe(originalFormat);
  });

  it('rolls back localStorage on API failure (Req 11.4)', async () => {
    // Seed a cache so we can verify rollback
    const originalCache: UserSettings = { ...defaultSettings };
    localStorage.setItem(LS_KEY, JSON.stringify(originalCache));
    mockUpdateSettings.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ dateFormat: 'DD/MM/YYYY' }).catch(() => {});
    });

    const cached = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
    // Should be back to original (post-API-fetch value, not the patched value)
    expect(cached.dateFormat).toBe('YYYY-MM-DD');
  });

  it('re-throws the error on API failure', async () => {
    mockUpdateSettings.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.updateSettings({ dateFormat: 'DD/MM/YYYY' })).rejects.toThrow(
        'API error'
      );
    });
  });
});

describe('useSettings — outside provider', () => {
  it('throws an error when used outside SettingsProvider', () => {
    // Suppress React's error output for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used within a SettingsProvider'
    );

    consoleSpy.mockRestore();
  });
});
