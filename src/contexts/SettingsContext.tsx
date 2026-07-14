/**
 * Settings context, provider, and convenience hook.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';
import { LS_SETTINGS_CACHE } from '../lib/constants';
import type { DateFormat, DefaultDateRange, UserSettings } from '../types/settings';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface SettingsContextValue {
  /** Authenticated user's display name (editable). Empty string until settings load. */
  displayName: string;
  /** Authenticated user's username (read-only from API). Empty string until settings load. */
  username: string;
  dateFormat: DateFormat;
  defaultDateRange: DefaultDateRange;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Pick<UserSettings, 'dateFormat' | 'defaultDateRange'> = {
  dateFormat: 'YYYY-MM-DD',
  defaultDateRange: 'last30',
};

function readCache(): Partial<UserSettings> | null {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_CACHE);
    return raw ? (JSON.parse(raw) as Partial<UserSettings>) : null;
  } catch {
    return null;
  }
}

function writeCache(settings: Partial<UserSettings>): void {
  try {
    localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(settings));
  } catch {
    // Silently ignore storage quota errors
  }
}

function rollbackCache(previous: Partial<UserSettings> | null): void {
  try {
    if (previous === null) {
      localStorage.removeItem(LS_SETTINGS_CACHE);
    } else {
      localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(previous));
    }
  } catch {
    // Silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(() => {
    // Req 11.5: Fall back to settings_cache for instant reads on mount
    const cached = readCache();
    if (cached?.dateFormat && cached?.defaultDateRange) {
      return {
        displayName: cached.displayName ?? '',
        username: cached.username ?? '',
        dateFormat: cached.dateFormat,
        defaultDateRange: cached.defaultDateRange,
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings from API on mount
  useEffect(() => {
    let cancelled = false;

    settingsService
      .getSettings()
      .then((fetched) => {
        if (cancelled) return;
        setSettings(fetched);
        writeCache(fetched);
      })
      .catch(() => {
        // API fetch failed — cached / default values remain in use
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Optimistic update with rollback on failure
  const updateSettings = async (patch: Partial<UserSettings>): Promise<void> => {
    const previousSettings = settings;
    const previousCache = readCache();

    // Build the new merged settings
    const merged: UserSettings = {
      displayName: settings?.displayName ?? '',
      username: settings?.username ?? '',
      dateFormat: settings?.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
      defaultDateRange: settings?.defaultDateRange ?? DEFAULT_SETTINGS.defaultDateRange,
      ...patch,
    };

    // Step 1: Optimistic in-memory update
    setSettings(merged);

    // Step 2: Write to localStorage
    writeCache(merged);

    // Step 3: API PATCH
    try {
      const updated = await settingsService.updateSettings(patch);
      // Sync in-memory state with server response (source of truth)
      setSettings(updated);
      writeCache(updated);
    } catch (err) {
      // Step 4: Rollback on failure
      setSettings(previousSettings);
      rollbackCache(previousCache);
      throw err;
    }
  };

  const dateFormat = settings?.dateFormat ?? DEFAULT_SETTINGS.dateFormat;
  const defaultDateRange = settings?.defaultDateRange ?? DEFAULT_SETTINGS.defaultDateRange;
  const displayName = settings?.displayName ?? '';
  const username = settings?.username ?? '';

  return (
    <SettingsContext.Provider value={{ displayName, username, dateFormat, defaultDateRange, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Convenience hook
// ---------------------------------------------------------------------------

/** Returns the current settings context. Must be used inside a `SettingsProvider`. */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
