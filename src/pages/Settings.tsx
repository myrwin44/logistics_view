/**
 * Settings page — user profile and application preferences.
 */

import { useEffect, useId, useRef, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import type { DateFormat, DefaultDateRange } from '@/types/settings';

// ---------------------------------------------------------------------------
// Date format options
// ---------------------------------------------------------------------------

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
];

// ---------------------------------------------------------------------------
// Default date range options
// ---------------------------------------------------------------------------

const DATE_RANGE_OPTIONS: { value: DefaultDateRange; label: string }[] = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'currentMonth', label: 'Current month' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Settings() {
  const { displayName, username, dateFormat, defaultDateRange, updateSettings } = useSettings();

  // Local form state — controlled inputs initialized from context
  const [formDisplayName, setFormDisplayName] = useState(displayName);
  const [formDateFormat, setFormDateFormat] = useState<DateFormat>(dateFormat);
  const [formDateRange, setFormDateRange] = useState<DefaultDateRange>(defaultDateRange);

  // Keep form in sync when context values load (e.g. after API fetch completes)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (displayName || username)) {
      setFormDisplayName(displayName);
      setFormDateFormat(dateFormat);
      setFormDateRange(defaultDateRange);
      initializedRef.current = true;
    }
  }, [displayName, username, dateFormat, defaultDateRange]);

  // Submit state
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Toast
  const toast = useToast(3000);

  // Accessibility IDs
  const displayNameId = useId();
  const usernameId = useId();
  const dateFormatId = useId();
  const dateRangeId = useId();
  const saveErrorId = useId();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear previous errors
    setValidationError(null);
    setSaveError(null);

    // Client-side validation
    if (!formDisplayName.trim()) {
      setValidationError('Display name is required');
      return;
    }

    // Submit
    setIsSaving(true);
    try {
      await updateSettings({
        displayName: formDisplayName.trim(),
        dateFormat: formDateFormat,
        defaultDateRange: formDateRange,
      });

      // Success toast auto-dismisses after 3s
      toast.show();
    } catch {
      // Inline error — (form values are preserved because we only update
      // state on user input, not on failure)
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="max-w-lg">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-ink">Settings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your profile and application preferences.
          </p>
        </div>

        <form onSubmit={handleSave} noValidate aria-label="Settings form">
          {/* ----------------------------------------------------------------
              Section: Profile
          ---------------------------------------------------------------- */}
          <section aria-labelledby="section-profile" className="mb-8">
            <h2
              id="section-profile"
              className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4"
            >
              Profile
            </h2>

            <div className="space-y-4">
              {/* Display name — editable */}
              <FormField id={displayNameId} label="Display name" error={validationError ?? undefined}>
                <Input
                  id={displayNameId}
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  aria-describedby={validationError ? `${displayNameId}-error` : undefined}
                  aria-invalid={validationError ? true : undefined}
                  disabled={isSaving}
                  placeholder="Your display name"
                  autoComplete="name"
                />
              </FormField>

              {/* Username — read-only */}
              <FormField id={usernameId} label="Username (read-only)">
                <Input
                  id={usernameId}
                  type="text"
                  value={username}
                  readOnly
                  disabled
                  className={cn(
                    'bg-surface cursor-not-allowed text-ink-muted',
                  )}
                />
              </FormField>
            </div>
          </section>

          {/* ----------------------------------------------------------------
              Section: Preferences
          ---------------------------------------------------------------- */}
          <section aria-labelledby="section-preferences" className="mb-8">
            <h2
              id="section-preferences"
              className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4"
            >
              Preferences
            </h2>

            <div className="space-y-4">
              {/* Date format*/}
              <FormField id={dateFormatId} label="Date format">
                <Select
                  value={formDateFormat}
                  onValueChange={(v) => setFormDateFormat(v as DateFormat)}
                  disabled={isSaving}
                >
                  <SelectTrigger id={dateFormatId} aria-label="Date format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Default date range*/}
              <FormField id={dateRangeId} label="Default date range">
                <Select
                  value={formDateRange}
                  onValueChange={(v) => setFormDateRange(v as DefaultDateRange)}
                  disabled={isSaving}
                >
                  <SelectTrigger id={dateRangeId} aria-label="Default date range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </section>

          {/* ----------------------------------------------------------------
              Save button + inline error
          ---------------------------------------------------------------- */}
          <div>
            <Button
              type="submit"
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Saving…</span>
                </>
              ) : (
                'Save'
              )}
            </Button>

            {/* Inline save error*/}
            {saveError && (
              <p
                id={saveErrorId}
                role="alert"
                aria-describedby={saveErrorId}
                className="mt-3 text-sm text-red-600"
              >
                {saveError}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ----------------------------------------------------------------
          Success toast
          The ToastProvider + ToastViewport are mounted in App.tsx,
          so we only need the Toast root here.
      ---------------------------------------------------------------- */}
      <ToastPrimitive.Root
        open={toast.isOpen}
        onOpenChange={(open) => !open && toast.dismiss()}
        duration={3000}
        className={cn(
          'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-4 pr-8 shadow-lg transition-all',
          'border border-border bg-white text-ink',
          'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
          'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
          'data-[state=open]:slide-in-from-bottom-full',
        )}
        aria-live="polite"
      >
        <ToastPrimitive.Title className="text-sm font-semibold">
          Display name updated
        </ToastPrimitive.Title>
        <ToastPrimitive.Close
          className={cn(
            'absolute right-2 top-2 rounded-md p-1 text-ink-muted opacity-0 transition-opacity',
            'hover:text-ink focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary',
            'group-hover:opacity-100',
          )}
          aria-label="Close notification"
        >
          <span className="sr-only">Close</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    </>
  );
}
