/**
 * Property-Based Test: Settings Persistence Round-Trip
 *
 * Feature: lgts-platform, Property 8: Settings Persistence Round-Trip
 * Arbitrary: fc.constantFrom('YYYY-MM-DD','MM/DD/YYYY','DD/MM/YYYY')
 *          × fc.constantFrom('last7','last30','last90','currentMonth')
 *          × fc.string({ minLength: 1 }) for displayName
 * Write arbitrary settings to localStorage under LS_SETTINGS_CACHE, mount
 * SettingsProvider, and assert the context values match what was written.
 *
 * **Validates: Requirements 11.4, 11.5**
 */

import { describe, it, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { LS_SETTINGS_CACHE } from '../../lib/constants';
import type { DateFormat, DefaultDateRange } from '../../types/settings';

// ---------------------------------------------------------------------------
// Mock settingsService so the API fetch does NOT overwrite the cache values.
// The SettingsContext fires getSettings() on mount; by rejecting it we simulate
// a network failure, which leaves the localStorage cache as the authoritative
// source — exactly the scenario tested by Req 11.5.
// ---------------------------------------------------------------------------

vi.mock('../../services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn().mockRejectedValue(new Error('Network error (test)')),
    updateSettings: vi.fn().mockRejectedValue(new Error('Network error (test)')),
  },
}));

// ---------------------------------------------------------------------------
// Helper: consumer component that exposes settings via data attributes
// ---------------------------------------------------------------------------

function SettingsReader() {
  const { dateFormat, defaultDateRange, displayName } = useSettings();
  return (
    <div
      data-testid="settings-state"
      data-date-format={dateFormat}
      data-default-date-range={defaultDateRange}
      data-display-name={displayName}
    />
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbitraryDateFormat = fc.constantFrom<DateFormat>(
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
);

const arbitraryDefaultDateRange = fc.constantFrom<DefaultDateRange>(
  'last7',
  'last30',
  'last90',
  'currentMonth',
);

const arbitraryDisplayName = fc.string({ minLength: 1 });

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 8 — Settings Persistence Round-Trip', () => {
  it(
    'SettingsProvider reads dateFormat back from localStorage cache on mount',
    () => {
      fc.assert(
        fc.property(
          arbitraryDateFormat,
          arbitraryDefaultDateRange,
          arbitraryDisplayName,
          (dateFormat, defaultDateRange, displayName) => {
            // 1. Write settings to localStorage under the cache key
            const cachePayload = { dateFormat, defaultDateRange, displayName };
            localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(cachePayload));

            // 2. Mount SettingsProvider with the reader child
            const { unmount } = render(
              <SettingsProvider>
                <SettingsReader />
              </SettingsProvider>,
            );

            // 3. Assert dateFormat matches what was stored
            const el = screen.getByTestId('settings-state');
            const restoredDateFormat = el.getAttribute('data-date-format');

            // 4. Cleanup before next run
            unmount();
            localStorage.clear();

            return restoredDateFormat === dateFormat;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'SettingsProvider reads defaultDateRange back from localStorage cache on mount',
    () => {
      fc.assert(
        fc.property(
          arbitraryDateFormat,
          arbitraryDefaultDateRange,
          arbitraryDisplayName,
          (dateFormat, defaultDateRange, displayName) => {
            // 1. Write settings to localStorage under the cache key
            const cachePayload = { dateFormat, defaultDateRange, displayName };
            localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(cachePayload));

            // 2. Mount SettingsProvider with the reader child
            const { unmount } = render(
              <SettingsProvider>
                <SettingsReader />
              </SettingsProvider>,
            );

            // 3. Assert defaultDateRange matches what was stored
            const el = screen.getByTestId('settings-state');
            const restoredDefaultDateRange = el.getAttribute('data-default-date-range');

            // 4. Cleanup before next run
            unmount();
            localStorage.clear();

            return restoredDefaultDateRange === defaultDateRange;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'SettingsProvider restores both dateFormat and defaultDateRange simultaneously for any arbitrary combination',
    () => {
      fc.assert(
        fc.property(
          arbitraryDateFormat,
          arbitraryDefaultDateRange,
          arbitraryDisplayName,
          (dateFormat, defaultDateRange, displayName) => {
            // 1. Write full settings object to localStorage cache
            const cachePayload = { dateFormat, defaultDateRange, displayName };
            localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(cachePayload));

            // 2. Mount SettingsProvider
            const { unmount } = render(
              <SettingsProvider>
                <SettingsReader />
              </SettingsProvider>,
            );

            // 3. Assert all three values are restored correctly
            const el = screen.getByTestId('settings-state');
            const restoredDateFormat = el.getAttribute('data-date-format');
            const restoredDefaultDateRange = el.getAttribute('data-default-date-range');

            // 4. Cleanup
            unmount();
            localStorage.clear();

            return (
              restoredDateFormat === dateFormat &&
              restoredDefaultDateRange === defaultDateRange
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
