/**
 * Unit tests for ScheduleForm and ScheduleResults
 *
 * ScheduleForm (src/pages/schedule/ScheduleForm.tsx):
 *   - Renders start date and end date inputs with labels
 *   - Validation: empty start date shows error (Req 5.2)
 *   - Validation: empty end date shows error (Req 5.2)
 *   - Validation: end date before start date shows error (Req 5.2)
 *   - Valid inputs call onGenerate with correct dates (Req 5.2)
 *   - Button is disabled while isLoading=true (Req 5.4)
 *   - Button shows loading text while isLoading=true (Req 5.4)
 *   - onGenerate is not called when validation fails (Req 5.2)
 *
 * ScheduleResults (src/pages/schedule/ScheduleResults.tsx):
 *   - Returns null for null scheduleRun
 *   - Returns null for Pending scheduleRun
 *   - Completed run: AI-provenance (#A25772) header strip present (Req 5.5)
 *   - Completed run with trips: renders per-trip cards with left border color (Req 5.5)
 *   - Completed run with zero trips: shows "No routes generated" message (Req 5.6)
 *   - Failed run: shows error message from errorMessage field (Req 5.7)
 *   - Failed run: shows Retry button that calls onRetry (Req 5.7)
 *
 * Requirements: 5.2, 5.4, 5.5, 5.6, 5.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleForm } from '../../../pages/schedule/ScheduleForm';
import { ScheduleResults } from '../../../pages/schedule/ScheduleResults';
import type { ScheduleRun, ScheduledTrip } from '../../../types/schedule';

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

function buildTrip(id: string): ScheduledTrip {
  return {
    tripId: id,
    vehicle: { name: `Truck ${id}`, plateNumber: `PLT-${id}` },
    originWarehouse: 'Warehouse A',
    destinationWarehouse: 'Warehouse B',
    stops: [
      { sequence: 1, warehouseName: 'Stop Alpha' },
      { sequence: 2, warehouseName: 'Stop Beta' },
    ],
    shipmentCount: 3,
  };
}

const COMPLETED_RUN_WITH_TRIPS: ScheduleRun = {
  id: 'run-1',
  status: 'Completed',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  generatedTrips: [buildTrip('T001'), buildTrip('T002')],
};

const COMPLETED_RUN_ZERO_TRIPS: ScheduleRun = {
  id: 'run-2',
  status: 'Completed',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  generatedTrips: [],
};

const FAILED_RUN: ScheduleRun = {
  id: 'run-3',
  status: 'Failed',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  generatedTrips: [],
  errorMessage: 'Optimization engine timed out',
};

const PENDING_RUN: ScheduleRun = {
  id: 'run-4',
  status: 'Pending',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  generatedTrips: [],
};

// ---------------------------------------------------------------------------
// ScheduleForm tests
// ---------------------------------------------------------------------------

describe('ScheduleForm', () => {
  let onGenerate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onGenerate = vi.fn();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders a start date input with a label', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('renders an end date input with a label', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('renders the Generate Schedule button', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);
      expect(
        screen.getByRole('button', { name: /generate schedule/i }),
      ).toBeInTheDocument();
    });

    it('start and end inputs are type="date"', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);
      expect(screen.getByLabelText(/start date/i)).toHaveAttribute('type', 'date');
      expect(screen.getByLabelText(/end date/i)).toHaveAttribute('type', 'date');
    });
  });

  // ── Validation — Req 5.2 ──────────────────────────────────────────────────

  describe('Validation (Req 5.2)', () => {
    it('shows "Start date is required" when start date is empty on submit', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      // Fill end date only, leave start empty
      await user.type(screen.getByLabelText(/end date/i), '2024-01-31');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });

    it('shows "End date is required" when end date is empty on submit', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      // Fill start date only, leave end empty
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });

    it('shows both field errors when both fields are empty on submit', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(screen.getByText('Start date is required')).toBeInTheDocument();
      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });

    it('shows end date error when end date is before start date', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/start date/i), '2024-01-31');
      await user.type(screen.getByLabelText(/end date/i), '2024-01-01');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(
        screen.getByText(/end date must be on or after the start date/i),
      ).toBeInTheDocument();
    });

    it('validation error messages have role="alert" for accessibility', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('does not call onGenerate when start date is missing', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/end date/i), '2024-01-31');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('does not call onGenerate when end date is missing', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('does not call onGenerate when end date is before start date', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/start date/i), '2024-01-31');
      await user.type(screen.getByLabelText(/end date/i), '2024-01-01');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('calls onGenerate with correct dates when both fields are valid', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.type(screen.getByLabelText(/end date/i), '2024-01-31');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(onGenerate).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    });

    it('accepts same-day range (end date equals start date)', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      await user.type(screen.getByLabelText(/start date/i), '2024-06-15');
      await user.type(screen.getByLabelText(/end date/i), '2024-06-15');
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));

      expect(onGenerate).toHaveBeenCalledWith('2024-06-15', '2024-06-15');
      expect(
        screen.queryByText(/end date must be on or after/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Loading state — Req 5.4 ───────────────────────────────────────────────

  describe('Loading state (Req 5.4)', () => {
    it('disables the Generate Schedule button when isLoading=true', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={true} />);

      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    });

    it('shows "Generating…" text on the button when isLoading=true', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={true} />);

      expect(screen.getByRole('button', { name: /generating/i })).toBeInTheDocument();
    });

    it('button is NOT disabled when isLoading=false', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      expect(
        screen.getByRole('button', { name: /generate schedule/i }),
      ).not.toBeDisabled();
    });

    it('disables start date input while isLoading=true', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={true} />);

      expect(screen.getByLabelText(/start date/i)).toBeDisabled();
    });

    it('disables end date input while isLoading=true', () => {
      render(<ScheduleForm onGenerate={onGenerate} isLoading={true} />);

      expect(screen.getByLabelText(/end date/i)).toBeDisabled();
    });
  });

  // ── Error clearing ────────────────────────────────────────────────────────

  describe('Error clearing', () => {
    it('clears start date error when the user starts typing in the start date field', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));
      expect(screen.getByText('Start date is required')).toBeInTheDocument();

      // Start typing in start date field
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');

      expect(screen.queryByText('Start date is required')).not.toBeInTheDocument();
    });

    it('clears end date error when the user starts typing in the end date field', async () => {
      const user = userEvent.setup();
      render(<ScheduleForm onGenerate={onGenerate} isLoading={false} />);

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /generate schedule/i }));
      expect(screen.getByText('End date is required')).toBeInTheDocument();

      // Start typing in end date field
      await user.type(screen.getByLabelText(/end date/i), '2024-01-31');

      expect(screen.queryByText('End date is required')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ScheduleResults tests
// ---------------------------------------------------------------------------

describe('ScheduleResults', () => {
  let onRetry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRetry = vi.fn();
  });

  // ── Null / Pending → renders nothing ──────────────────────────────────────

  describe('Null / Pending state', () => {
    it('renders nothing when scheduleRun is null', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={null} onRetry={onRetry} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when scheduleRun status is Pending', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={PENDING_RUN} onRetry={onRetry} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  // ── Completed run with trips — Req 5.5 ────────────────────────────────────

  describe('Completed run with trips (Req 5.5)', () => {
    it('renders the results section when run is Completed', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders a header strip with AI-provenance (#A25772) background color', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );

      // Find the header strip element with the AI provenance background
      const aiColorRegex = /(#a25772|rgb\(\s*162\s*,\s*87\s*,\s*114\s*\))/i;
      const styledElements = container.querySelectorAll('[style]');
      const provenanceElements = Array.from(styledElements).filter((el) =>
        aiColorRegex.test(el.getAttribute('style') ?? ''),
      );

      expect(provenanceElements.length).toBeGreaterThan(0);
    });

    it('shows trip count in the header (e.g., "2 Trips Generated")', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByText(/2 trips generated/i)).toBeInTheDocument();
    });

    it('renders a card for each generated trip', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      // Each TripCard has an aria-label containing the vehicle name
      expect(screen.getByLabelText(/truck T001/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/truck T002/i)).toBeInTheDocument();
    });

    it('renders trip card with left border using AI-provenance color', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );

      // TripCard articles have border-left style with the AI provenance color
      const aiColorRegex = /(#A25772|rgb\(\s*162\s*,\s*87\s*,\s*114\s*\))/i;
      const articles = container.querySelectorAll('article[style]');
      const provenanceBorder = Array.from(articles).filter((el) =>
        aiColorRegex.test(el.getAttribute('style') ?? ''),
      );

      expect(provenanceBorder.length).toBe(COMPLETED_RUN_WITH_TRIPS.generatedTrips.length);
    });

    it('renders vehicle name and plate number on each trip card', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByText('Truck T001')).toBeInTheDocument();
      expect(screen.getByText('PLT-T001')).toBeInTheDocument();
    });

    it('renders origin and destination warehouses on each trip card', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      // Both trips share the same origin/destination in our fixture
      const originTexts = screen.getAllByText('Warehouse A');
      const destinationTexts = screen.getAllByText('Warehouse B');
      expect(originTexts.length).toBeGreaterThan(0);
      expect(destinationTexts.length).toBeGreaterThan(0);
    });

    it('renders stop sequence for each trip card', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      // Stop names appear for each trip
      expect(screen.getAllByText('Stop Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Stop Beta').length).toBeGreaterThan(0);
    });

    it('renders bill count on each trip card', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_WITH_TRIPS} onRetry={onRetry} />,
      );
      // Each trip fixture has shipmentCount=3 → "3 bills"
      const billLabels = screen.getAllByText(/3 bills/i);
      expect(billLabels.length).toBe(COMPLETED_RUN_WITH_TRIPS.generatedTrips.length);
    });
  });

  // ── Completed run with zero trips — Req 5.6 ───────────────────────────────

  describe('Completed run with zero trips (Req 5.6)', () => {
    it('renders "No routes generated" message when trip list is empty', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_ZERO_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByText(/no routes generated/i)).toBeInTheDocument();
    });

    it('renders the zero-trips panel with role="status"', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_ZERO_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows a hint about verifying unscheduled bills in the period', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_ZERO_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByText(/unscheduled/i)).toBeInTheDocument();
    });

    it('renders "Schedule Generated" heading text in zero-trips header strip', () => {
      render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_ZERO_TRIPS} onRetry={onRetry} />,
      );
      expect(screen.getByText(/schedule generated/i)).toBeInTheDocument();
    });

    it('zero-trips panel uses AI-provenance border color', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={COMPLETED_RUN_ZERO_TRIPS} onRetry={onRetry} />,
      );
      const aiColorRegex = /(#a25772|rgb\(\s*162\s*,\s*87\s*,\s*114\s*\))/i;
      const styledElements = container.querySelectorAll('[style]');
      const provenanceElements = Array.from(styledElements).filter((el) =>
        aiColorRegex.test(el.getAttribute('style') ?? ''),
      );
      expect(provenanceElements.length).toBeGreaterThan(0);
    });
  });

  // ── Failed run — Req 5.7 ──────────────────────────────────────────────────

  describe('Failed run (Req 5.7)', () => {
    it('renders an error alert when the run status is Failed', () => {
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows the error message from the run errorMessage field', () => {
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);
      expect(
        screen.getByText('Optimization engine timed out'),
      ).toBeInTheDocument();
    });

    it('shows "Schedule generation failed" heading in the error panel', () => {
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);
      expect(screen.getByText(/schedule generation failed/i)).toBeInTheDocument();
    });

    it('renders a Retry button', () => {
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRetry when the Retry button is clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render trip cards on a failed run', () => {
      render(<ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('failed run does not render #A25772 (uses red error palette instead)', () => {
      const { container } = render(
        <ScheduleResults scheduleRun={FAILED_RUN} onRetry={onRetry} />,
      );
      const aiColorRegex = /(#a25772|rgb\(\s*162\s*,\s*87\s*,\s*114\s*\))/i;
      const styledElements = container.querySelectorAll('[style]');
      const provenanceElements = Array.from(styledElements).filter((el) =>
        aiColorRegex.test(el.getAttribute('style') ?? ''),
      );
      expect(provenanceElements).toHaveLength(0);
    });

    it('handles failed run without an errorMessage gracefully', () => {
      const runNoMessage: ScheduleRun = { ...FAILED_RUN, errorMessage: undefined };
      render(<ScheduleResults scheduleRun={runNoMessage} onRetry={onRetry} />);

      // Should still show the heading and retry button
      expect(screen.getByText(/schedule generation failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
