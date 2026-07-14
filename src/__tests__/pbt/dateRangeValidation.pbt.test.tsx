/**
 * Property-Based Test: Date Range Validation — End Before Start
 *
 * Feature: lgts-platform, Property 4: Date Range Validation
 * Arbitrary: two fc.date() values where the first is strictly greater than the
 *            second (end before start), forming an invalid date range.
 * Apply to DateRangePicker → assert error shown and onApply NOT called.
 *
 * Validates: Requirements 3.3, 5.2
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { DateRangePicker } from '../../components/shared/DateRangePicker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date object to YYYY-MM-DD ISO string (local-date portion). */
function toIsoDateString(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface RenderResult {
  onApply: ReturnType<typeof vi.fn>;
}

function renderPicker(startDate: string, endDate: string): RenderResult {
  const onApply = vi.fn();
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  render(
    <DateRangePicker
      startDate={new Date(sy, sm - 1, sd)}
      endDate={new Date(ey, em - 1, ed)}
      onStartChange={vi.fn()}
      onEndChange={vi.fn()}
      onApply={onApply}
    />,
  );
  return { onApply };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates two dates constrained to the ISO-safe range (year 1000–9999) and
 * filters to only pairs where the first date is strictly after the second date.
 * We then use date1 as the start and date2 as the end — an invalid range.
 */
const SAFE_DATE = fc.date({
  min: new Date('1000-01-03T00:00:00.000Z'),
  max: new Date('9999-12-29T23:59:59.999Z'),
});

const arbitraryInvalidDateRange = fc
  .tuple(SAFE_DATE, SAFE_DATE)
  .filter(([d1, d2]) => {
    // Compare only calendar-day strings to avoid time-only differences
    // that would not manifest when formatted as YYYY-MM-DD
    return toIsoDateString(d1) > toIsoDateString(d2);
  })
  .map(([d1, d2]) => ({
    // d1 is later → use as start; d2 is earlier → use as end (invalid range)
    startDate: toIsoDateString(d1),
    endDate: toIsoDateString(d2),
  }));

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 4 — Date Range Validation: End Before Start', () => {
  it(
    'shows an error when end date is before start date',
    () => {
      fc.assert(
        fc.property(
          arbitraryInvalidDateRange,
          ({ startDate, endDate }) => {
            renderPicker(startDate, endDate);

            // Click the Apply button
            const applyButton = screen.getByRole('button', { name: /apply/i });
            fireEvent.click(applyButton);

            // An error element with role="alert" must be visible
            const alertElement = screen.queryByRole('alert');
            const errorShown = alertElement !== null;

            cleanup();
            vi.clearAllMocks();

            return errorShown;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'does NOT call onApply when end date is before start date',
    () => {
      fc.assert(
        fc.property(
          arbitraryInvalidDateRange,
          ({ startDate, endDate }) => {
            const { onApply } = renderPicker(startDate, endDate);

            const applyButton = screen.getByRole('button', { name: /apply/i });
            fireEvent.click(applyButton);

            // onApply must never have been invoked for an invalid range
            const applyNotCalled = onApply.mock.calls.length === 0;

            cleanup();
            vi.clearAllMocks();

            return applyNotCalled;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'shows error AND withholds onApply for any end-before-start range',
    () => {
      fc.assert(
        fc.property(
          arbitraryInvalidDateRange,
          ({ startDate, endDate }) => {
            const { onApply } = renderPicker(startDate, endDate);

            const applyButton = screen.getByRole('button', { name: /apply/i });
            fireEvent.click(applyButton);

            const alertElement = screen.queryByRole('alert');
            const errorShown = alertElement !== null;
            const applyNotCalled = onApply.mock.calls.length === 0;

            cleanup();
            vi.clearAllMocks();

            return errorShown && applyNotCalled;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
