/**
 * Unit tests for src/pages/Settings.tsx
 *
 * Covers:
 * - Req 11.1: Display name input (editable) and username input (read-only) rendered
 * - Req 11.3: Empty/whitespace display name → validation error shown, updateSettings NOT called
 * - Req 11.2: Successful save → success toast "Display name updated" shown
 * - Req 11.4: Date format select shows all 3 options (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
 * - Req 11.5: Default date range select shows all 4 options
 * - Req 11.6: While saving → Save button disabled + loading indicator shown
 * - Req 11.7: On failure → inline error message shown; form values preserved
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as ToastPrimitive from '@radix-ui/react-toast';

// ---------------------------------------------------------------------------
// Mock useSettings — isolates Settings page from the real context/API
// ---------------------------------------------------------------------------

const mockUpdateSettings = vi.fn();

const DEFAULT_SETTINGS = {
  displayName: 'Ada Lovelace',
  username: 'ada.lovelace',
  dateFormat: 'YYYY-MM-DD' as const,
  defaultDateRange: 'last30' as const,
  updateSettings: mockUpdateSettings,
  isLoading: false,
};

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => DEFAULT_SETTINGS,
}));

// ---------------------------------------------------------------------------
// Helper — import after mocks are hoisted
// ---------------------------------------------------------------------------

async function importSettings() {
  const mod = await import('@/pages/Settings');
  return mod.default;
}

/**
 * Wraps the component under test with Radix ToastProvider + ToastViewport so
 * that toast notifications can be rendered and queried in tests.
 */
function renderSettings(SettingsPage: React.ComponentType) {
  return render(
    <ToastPrimitive.Provider>
      <SettingsPage />
      <ToastPrimitive.Viewport
        style={{ position: 'fixed', bottom: 0, right: 0 }}
      />
    </ToastPrimitive.Provider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Settings page', () => {
  beforeEach(() => {
    mockUpdateSettings.mockReset();
    // Default: resolves successfully
    mockUpdateSettings.mockResolvedValue(undefined);
    vi.resetModules();
  });

  // ── Req 11.1 — profile inputs ─────────────────────────────────────────────

  describe('Req 11.1 — profile inputs', () => {
    it('renders an editable display name input pre-filled with the current display name', async () => {
      const Settings = await importSettings();
      renderSettings(Settings);

      const input = screen.getByLabelText(/display name/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Ada Lovelace');
      expect(input).not.toHaveAttribute('readonly');
      expect(input).not.toBeDisabled();
    });

    it('renders a read-only username input labeled "Username (read-only)"', async () => {
      const Settings = await importSettings();
      renderSettings(Settings);

      const input = screen.getByLabelText(/username \(read-only\)/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('ada.lovelace');
      // Shadcn Input with readOnly + disabled attributes
      expect(input).toBeDisabled();
    });
  });

  // ── Req 11.3 — empty display name validation ──────────────────────────────

  describe('Req 11.3 — empty display name validation', () => {
    it('shows "Display name is required" when display name is empty and Save is clicked', async () => {
      const user = userEvent.setup();
      const Settings = await importSettings();
      renderSettings(Settings);

      // Clear the display name field
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Display name is required',
      );
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('shows "Display name is required" when display name is only whitespace', async () => {
      const user = userEvent.setup();
      const Settings = await importSettings();
      renderSettings(Settings);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, '   ');

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Display name is required',
      );
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('does NOT call updateSettings when the validation error is triggered', async () => {
      const user = userEvent.setup();
      const Settings = await importSettings();
      renderSettings(Settings);

      await user.clear(screen.getByLabelText(/display name/i));
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });
  });

  // ── Req 11.2 — success toast ──────────────────────────────────────────────

  describe('Req 11.2 — success toast', () => {
    it('shows "Display name updated" toast after a successful save', async () => {
      const user = userEvent.setup();
      mockUpdateSettings.mockResolvedValue(undefined);
      const Settings = await importSettings();
      renderSettings(Settings);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/display name updated/i),
        ).toBeInTheDocument();
      });
    });

    it('does NOT show the toast before a save is submitted', async () => {
      const Settings = await importSettings();
      renderSettings(Settings);

      expect(screen.queryByText(/display name updated/i)).not.toBeInTheDocument();
    });
  });

  // ── Req 11.4 — date format options ────────────────────────────────────────

  describe('Req 11.4 — date format options', () => {
    it('date format select shows all 3 format options', async () => {
      const Settings = await importSettings();
      const { container } = renderSettings(Settings);

      // Radix Select renders a visually-hidden native <select> that contains
      // all options as <option> elements — always present in the DOM even when
      // the popover is closed. Query those to assert option presence without
      // having to open the popover (which requires pointer-capture support).
      const selects = container.querySelectorAll('select');
      // First native select belongs to the "Date format" combobox
      const dateFormatSelect = selects[0];

      const optionValues = Array.from(dateFormatSelect.options).map(
        (o) => o.value,
      );
      expect(optionValues).toContain('YYYY-MM-DD');
      expect(optionValues).toContain('MM/DD/YYYY');
      expect(optionValues).toContain('DD/MM/YYYY');
    });
  });

  // ── Req 11.5 — default date range options ─────────────────────────────────

  describe('Req 11.5 — default date range options', () => {
    it('default date range select shows all 4 options', async () => {
      const Settings = await importSettings();
      const { container } = renderSettings(Settings);

      // Second native select belongs to the "Default date range" combobox
      const selects = container.querySelectorAll('select');
      const dateRangeSelect = selects[1];

      const optionValues = Array.from(dateRangeSelect.options).map(
        (o) => o.value,
      );
      expect(optionValues).toContain('last7');
      expect(optionValues).toContain('last30');
      expect(optionValues).toContain('last90');
      expect(optionValues).toContain('currentMonth');

      // Also verify human-readable labels
      const optionLabels = Array.from(dateRangeSelect.options).map(
        (o) => o.text,
      );
      expect(optionLabels).toContain('Last 7 days');
      expect(optionLabels).toContain('Last 30 days');
      expect(optionLabels).toContain('Last 90 days');
      expect(optionLabels).toContain('Current month');
    });
  });

  // ── Req 11.6 — saving state ───────────────────────────────────────────────

  describe('Req 11.6 — loading indicator while saving', () => {
    it('disables the Save button while a save is in progress', async () => {
      const user = userEvent.setup();
      // Keep the promise unresolved so the component stays in the saving state
      let resolveUpdate!: () => void;
      mockUpdateSettings.mockReturnValue(
        new Promise<void>((res) => {
          resolveUpdate = res;
        }),
      );

      const Settings = await importSettings();
      renderSettings(Settings);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      // The button should now be disabled (shows "Saving…")
      expect(
        screen.getByRole('button', { name: /saving/i }),
      ).toBeDisabled();

      // Resolve to clean up
      resolveUpdate();
    });

    it('shows a loading indicator (Loader2 spinner) while saving', async () => {
      const user = userEvent.setup();
      let resolveUpdate!: () => void;
      mockUpdateSettings.mockReturnValue(
        new Promise<void>((res) => {
          resolveUpdate = res;
        }),
      );

      const Settings = await importSettings();
      renderSettings(Settings);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      // The button text changes to "Saving…" (contains the spinner + text)
      expect(screen.getByText(/saving/i)).toBeInTheDocument();

      resolveUpdate();
    });
  });

  // ── Req 11.7 — failure handling ───────────────────────────────────────────

  describe('Req 11.7 — inline error on failure', () => {
    it('shows "Failed to save settings. Please try again." when updateSettings rejects', async () => {
      const user = userEvent.setup();
      mockUpdateSettings.mockRejectedValue(new Error('Network error'));

      const Settings = await importSettings();
      renderSettings(Settings);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Failed to save settings. Please try again.',
        );
      });
    });

    it('preserves the display name input value after a failed save', async () => {
      const user = userEvent.setup();
      mockUpdateSettings.mockRejectedValue(new Error('Server error'));

      const Settings = await importSettings();
      renderSettings(Settings);

      // Change the display name before saving
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'New Name');

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Failed to save settings. Please try again.',
        );
      });

      // Display name input should still hold the value the user typed
      expect(screen.getByLabelText(/display name/i)).toHaveValue('New Name');
    });

    it('does NOT show the inline error when save succeeds', async () => {
      const user = userEvent.setup();
      mockUpdateSettings.mockResolvedValue(undefined);

      const Settings = await importSettings();
      renderSettings(Settings);

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/failed to save settings/i),
        ).not.toBeInTheDocument();
      });
    });
  });
});
