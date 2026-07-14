/**
 * Property-Based Test: AI Provenance Color Exclusivity
 *
 * Feature: lgts-platform, Property 5: AI Provenance Color Exclusivity
 * Arbitrary: fc.constantFrom('Pending', 'Completed', 'Failed') for schedule run status,
 *            fc.integer({ min: 0, max: 10 }) for trip count.
 * Render the Schedule page for each case; assert that #A25772 appears ONLY in
 * ScheduleResults panel elements (header strip, card borders) — never in ScheduleForm
 * or other Scheduling page elements.
 *
 * **Validates: Requirements 5.8**
 */

import { describe, it, afterEach, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import type { ScheduleRun, ScheduledTrip } from '../../types/schedule';
import type { UseScheduleResult } from '../../hooks/useSchedule';

// ---------------------------------------------------------------------------
// Mock useSchedule before importing Schedule
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useSchedule');

// Import Schedule AFTER mock is set up
import Schedule from '../../pages/schedule/Schedule';
import { useSchedule } from '../../hooks/useSchedule';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The AI provenance color as defined in the spec (#A25772).
 * jsdom normalises hex colours to rgb() when set via React's style prop, so
 * we match BOTH the hex form (in case it appears as a raw attribute value)
 * and the normalised rgb() form that jsdom produces at runtime.
 *
 * #A25772 → rgb(162, 87, 114)
 */
const AI_PROVENANCE_REGEX = /(#a25772|rgb\(\s*162\s*,\s*87\s*,\s*114\s*\))/i;

// ---------------------------------------------------------------------------
// Helpers — build fixture data
// ---------------------------------------------------------------------------

function buildTrip(index: number): ScheduledTrip {
  return {
    tripId: `trip-${index}`,
    vehicle: { name: `Vehicle ${index}`, plateNumber: `PLT-${index}` },
    originWarehouse: `Origin ${index}`,
    destinationWarehouse: `Destination ${index}`,
    stops: [
      { sequence: 1, warehouseName: `Warehouse A-${index}` },
      { sequence: 2, warehouseName: `Warehouse B-${index}` },
    ],
    shipmentCount: 2,
  };
}

function buildScheduleRun(
  status: ScheduleRun['status'],
  tripCount: number,
): ScheduleRun | null {
  if (status === 'Pending') {
    // While pending, hook returns null / the run with Pending status but
    // ScheduleResults renders nothing for Pending — we still test
    return {
      id: 'run-1',
      status: 'Pending',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      generatedTrips: [],
    };
  }

  if (status === 'Failed') {
    return {
      id: 'run-1',
      status: 'Failed',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      generatedTrips: [],
      errorMessage: 'Optimization engine error',
    };
  }

  // Completed
  const trips = Array.from({ length: tripCount }, (_, i) => buildTrip(i));
  return {
    id: 'run-1',
    status: 'Completed',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    generatedTrips: trips,
  };
}

/**
 * Collect all DOM elements whose `style` attribute contains the AI provenance
 * colour value.
 */
function findElementsWithAiColor(container: HTMLElement): Element[] {
  const allElements = container.querySelectorAll('[style]');
  return Array.from(allElements).filter((el) => {
    const style = el.getAttribute('style') ?? '';
    return AI_PROVENANCE_REGEX.test(style);
  });
}

/**
 * Returns true if every element carrying #A25772 is a descendant of the
 * ScheduleResults section (identified by its aria-labelledby pointing to
 * "schedule-results-heading").
 *
 * ScheduleResults always wraps its output in:
 *   <section aria-labelledby="schedule-results-heading">
 */
function allAiColorElementsAreInResultsSection(container: HTMLElement): boolean {
  const aiColorElements = findElementsWithAiColor(container);

  // If no elements carry the color, the exclusivity constraint is trivially satisfied
  if (aiColorElements.length === 0) return true;

  // Locate the ScheduleResults section wrapper
  const resultsSection = container.querySelector(
    '[aria-labelledby="schedule-results-heading"]',
  );

  // If the results section is not present but color IS present → violation
  if (!resultsSection) return false;

  // Every element with the color must be contained within the results section
  return aiColorElements.every((el) => resultsSection.contains(el));
}

/**
 * Check that neither the ScheduleForm section nor the page header/wrapper
 * contains any element with inline #A25772 styling.
 */
function scheduleFormHasNoAiColor(container: HTMLElement): boolean {
  // ScheduleForm is inside the section with aria-labelledby="schedule-form-heading"
  const formSection = container.querySelector('[aria-labelledby="schedule-form-heading"]');
  if (!formSection) return true; // section not found — treat as satisfied

  const formColorElements = Array.from(formSection.querySelectorAll('[style]')).filter(
    (el) => AI_PROVENANCE_REGEX.test(el.getAttribute('style') ?? ''),
  );

  return formColorElements.length === 0;
}

/**
 * Check that the page wrapper header (containing the CalendarRange icon and
 * heading) does not contain any #A25772 coloring.
 */
function pageHeaderHasNoAiColor(container: HTMLElement): boolean {
  // Page header is a <header> element inside the flex column wrapper
  const pageHeader = container.querySelector('header');
  if (!pageHeader) return true;

  const headerColorElements = Array.from(pageHeader.querySelectorAll('[style]')).filter(
    (el) => AI_PROVENANCE_REGEX.test(el.getAttribute('style') ?? ''),
  );

  return headerColorElements.length === 0;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Property 5 — AI Provenance Color Exclusivity', () => {
  it(
    'renders without #A25772 in ScheduleForm for any run status and trip count',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ScheduleRun['status']>('Pending', 'Completed', 'Failed'),
          fc.integer({ min: 0, max: 10 }),
          (status, tripCount) => {
            const scheduleRun = buildScheduleRun(status, tripCount);

            // Mock the hook to return the desired state
            vi.mocked(useSchedule).mockReturnValue({
              scheduleRun,
              isLoading: status === 'Pending',
              error: null,
              generate: vi.fn(),
              reset: vi.fn(),
            } as UseScheduleResult);

            const { container } = render(<Schedule />);

            const formClean = scheduleFormHasNoAiColor(container);
            const headerClean = pageHeaderHasNoAiColor(container);

            cleanup();

            return formClean && headerClean;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    '#A25772 only appears inside ScheduleResults section for any run status and trip count',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ScheduleRun['status']>('Pending', 'Completed', 'Failed'),
          fc.integer({ min: 0, max: 10 }),
          (status, tripCount) => {
            const scheduleRun = buildScheduleRun(status, tripCount);

            vi.mocked(useSchedule).mockReturnValue({
              scheduleRun,
              isLoading: status === 'Pending',
              error: null,
              generate: vi.fn(),
              reset: vi.fn(),
            } as UseScheduleResult);

            const { container } = render(<Schedule />);

            const colorIsExclusive = allAiColorElementsAreInResultsSection(container);

            cleanup();

            return colorIsExclusive;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    'Completed run with trips: #A25772 present in results section and absent from form',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (tripCount) => {
            const scheduleRun = buildScheduleRun('Completed', tripCount);

            vi.mocked(useSchedule).mockReturnValue({
              scheduleRun,
              isLoading: false,
              error: null,
              generate: vi.fn(),
              reset: vi.fn(),
            } as UseScheduleResult);

            const { container } = render(<Schedule />);

            // Must have the color somewhere (in results)
            const aiColorElements = findElementsWithAiColor(container);
            const colorPresent = aiColorElements.length > 0;

            // All of those must be in the results section
            const colorExclusive = allAiColorElementsAreInResultsSection(container);

            // Form and page header must be clean
            const formClean = scheduleFormHasNoAiColor(container);
            const headerClean = pageHeaderHasNoAiColor(container);

            cleanup();

            return colorPresent && colorExclusive && formClean && headerClean;
          },
        ),
        { numRuns: 50 },
      );
    },
  );

  it(
    'Completed run with zero trips: AI provenance panel uses #A25772 only within results section',
    () => {
      const scheduleRun = buildScheduleRun('Completed', 0);

      vi.mocked(useSchedule).mockReturnValue({
        scheduleRun,
        isLoading: false,
        error: null,
        generate: vi.fn(),
        reset: vi.fn(),
      } as UseScheduleResult);

      const { container } = render(<Schedule />);

      const colorExclusive = allAiColorElementsAreInResultsSection(container);
      const formClean = scheduleFormHasNoAiColor(container);
      const headerClean = pageHeaderHasNoAiColor(container);

      cleanup();

      expect(colorExclusive).toBe(true);
      expect(formClean).toBe(true);
      expect(headerClean).toBe(true);
    },
  );

  it(
    'Failed run: no #A25772 anywhere (error state uses red palette, not AI provenance color)',
    () => {
      const scheduleRun = buildScheduleRun('Failed', 0);

      vi.mocked(useSchedule).mockReturnValue({
        scheduleRun,
        isLoading: false,
        error: null,
        generate: vi.fn(),
        reset: vi.fn(),
      } as UseScheduleResult);

      const { container } = render(<Schedule />);

      const aiColorElements = findElementsWithAiColor(container);

      cleanup();

      // Failed state renders FailedRunPanel with red styling, not #A25772
      expect(aiColorElements).toHaveLength(0);
    },
  );

  it(
    'Pending run: ScheduleResults renders nothing, so #A25772 must be absent from entire page',
    () => {
      const scheduleRun = buildScheduleRun('Pending', 0);

      vi.mocked(useSchedule).mockReturnValue({
        scheduleRun,
        isLoading: true,
        error: null,
        generate: vi.fn(),
        reset: vi.fn(),
      } as UseScheduleResult);

      const { container } = render(<Schedule />);

      const aiColorElements = findElementsWithAiColor(container);

      cleanup();

      // While pending, ScheduleResults returns null, so no #A25772 anywhere
      expect(aiColorElements).toHaveLength(0);
    },
  );
});
