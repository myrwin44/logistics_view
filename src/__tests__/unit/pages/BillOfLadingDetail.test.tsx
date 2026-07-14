/**
 * Unit tests for src/pages/billOfLading/BillOfLadingDetail.tsx
 *
 * Covers:
 * - Req 10.1: Header shows Bill ID, origin, destination, weight, StatusBadge,
 *             created date, and scheduled date (dash when scheduledDate is null).
 * - Req 10.2: Journey renders trip ID links (links to /transport-trips/:tripId).
 * - Req 10.3: isLoading=true shows skeleton (aria-busy elements, no h1).
 * - Req 10.4: notFound=true shows "Shipment bill not found" + back link to /bills.
 * - Req 10.7: status === 'Unscheduled' shows info banner with expected message.
 *
 * Requirements: 10.1, 10.4, 10.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ShipmentBill, BillJourneyStop } from '@/types/billOfLading';
import type { UseBillDetailResult } from '@/hooks/useBillDetail';

// ---------------------------------------------------------------------------
// Mock react-router-dom useParams so we control the :id param
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'B001' }),
  };
});

// ---------------------------------------------------------------------------
// Mock useBillDetail hook
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();

const DEFAULT_HOOK_STATE: UseBillDetailResult = {
  bill: null,
  isLoading: false,
  notFound: false,
  error: null,
  refetch: mockRefetch,
};

let hookState: UseBillDetailResult = { ...DEFAULT_HOOK_STATE };

vi.mock('@/hooks/useBillDetail', () => ({
  useBillDetail: () => hookState,
}));

// ---------------------------------------------------------------------------
// Mock useSettings context — provides stable dateFormat
// ---------------------------------------------------------------------------

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    dateFormat: 'YYYY-MM-DD',
    defaultDateRange: 'last30',
    updateSettings: vi.fn(),
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Mock formatDate so output is deterministic regardless of locale
// ---------------------------------------------------------------------------

vi.mock('@/lib/dateFormat', () => ({
  formatDate: (_date: string, _fmt: string) => '2024-06-15',
}));

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

function buildJourneyStop(sequence: number, tripId: string): BillJourneyStop {
  return {
    tripId,
    warehouseName: `Warehouse ${sequence}`,
    sequence,
    scheduledArrival: '2024-06-15T08:00:00Z',
    action: sequence % 2 === 1 ? 'load' : 'unload',
  };
}

const SAMPLE_JOURNEY: BillJourneyStop[] = [
  buildJourneyStop(1, 'TRIP-001'),
  buildJourneyStop(2, 'TRIP-001'),
];

const SAMPLE_BILL: ShipmentBill = {
  id: 'B001',
  originWarehouse: 'Warehouse Alpha',
  destinationWarehouse: 'Warehouse Beta',
  weightKg: 1200,
  status: 'Scheduled',
  scheduledDate: '2024-06-20',
  createdDate: '2024-06-01',
  journey: SAMPLE_JOURNEY,
};

const UNSCHEDULED_BILL: ShipmentBill = {
  ...SAMPLE_BILL,
  status: 'Unscheduled',
  scheduledDate: null,
  journey: [],
};

// ---------------------------------------------------------------------------
// Helper — lazy import after mocks are hoisted
// ---------------------------------------------------------------------------

async function importBillOfLadingDetail() {
  const mod = await import('@/pages/billOfLading/BillOfLadingDetail');
  return mod.default;
}

function renderDetail(Component: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={['/bills/B001']}>
      <Component />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BillOfLadingDetail page', () => {
  beforeEach(() => {
    hookState = { ...DEFAULT_HOOK_STATE, refetch: mockRefetch };
    mockRefetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Req 10.1: Header fields ────────────────────────────────────────────────

  describe('Header fields (Req 10.1)', () => {
    it('renders the Bill ID in the heading', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByRole('heading', { name: /B001/i })).toBeInTheDocument();
    });

    it('renders the origin warehouse', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByText('Warehouse Alpha')).toBeInTheDocument();
    });

    it('renders the destination warehouse', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByText('Warehouse Beta')).toBeInTheDocument();
    });

    it('renders the weight in kg', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByText(/1[,.]?200/)).toBeInTheDocument();
      expect(screen.getByText('kg')).toBeInTheDocument();
    });

    it('renders the StatusBadge with the bill status', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      // StatusBadge renders a <span role="status" aria-label="Scheduled">
      expect(screen.getByRole('status', { name: /scheduled/i })).toBeInTheDocument();
    });

    it('renders the formatted created date', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      // formatDate is mocked to return '2024-06-15'; "Created" label precedes it
      expect(screen.getByText('Created')).toBeInTheDocument();
      // At least one instance of the mocked date should be present
      const dateCells = screen.getAllByText('2024-06-15');
      expect(dateCells.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the formatted scheduled date label when scheduledDate is set', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      // The meta row contains a "Scheduled" label text (may appear multiple
      // times including StatusBadge), so assert at least one exists
      const scheduledLabels = screen.getAllByText('Scheduled');
      expect(scheduledLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a dash (—) for scheduled date when scheduledDate is null', async () => {
      hookState = { ...hookState, bill: UNSCHEDULED_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  // ── Req 10.2: Journey renders trip ID links ────────────────────────────────

  describe('Journey trip ID links (Req 10.2)', () => {
    it('renders a link to /transport-trips/:tripId for each journey stop', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      const tripLinks = screen.getAllByRole('link', {
        name: /view transport trip TRIP-001/i,
      });
      // Two stops both link to the same TRIP-001
      expect(tripLinks).toHaveLength(2);
      tripLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/transport-trips/TRIP-001');
      });
    });

    it('renders the trip ID as link text for each journey stop', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      const tripLabels = screen.getAllByText(/Trip TRIP-001/i);
      expect(tripLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Req 10.3: Skeleton loading state ──────────────────────────────────────

  describe('Skeleton loading state (Req 10.3)', () => {
    it('renders an aria-busy element for the bill header while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByLabelText(/loading bill details/i)).toBeInTheDocument();
    });

    it('renders an aria-busy element for the journey timeline while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByLabelText(/loading journey timeline/i)).toBeInTheDocument();
    });

    it('does NOT render a heading while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    it('does NOT render the not-found state while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.queryByText(/shipment bill not found/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Req 10.4: 404 / not-found state ───────────────────────────────────────

  describe('Not-found state (Req 10.4)', () => {
    it('renders "Shipment bill not found" message when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.getByText(/shipment bill not found/i),
      ).toBeInTheDocument();
    });

    it('renders a back link pointing to /bills when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      const backLink = screen.getByRole('link', { name: /back to bills of lading/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/bills');
    });

    it('does NOT render the bill heading when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('heading', { level: 1 }),
      ).not.toBeInTheDocument();
    });

    it('does NOT render journey stops when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('list', { name: /journey stops/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── Req 10.7: Unscheduled info banner ─────────────────────────────────────

  describe('Unscheduled info banner (Req 10.7)', () => {
    it('shows the info banner when status is "Unscheduled"', async () => {
      hookState = { ...hookState, bill: UNSCHEDULED_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.getByText(
          /this bill has not been assigned to a transport schedule yet/i,
        ),
      ).toBeInTheDocument();
    });

    it('does NOT show the info banner when status is not "Unscheduled"', async () => {
      hookState = { ...hookState, bill: SAMPLE_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(
        screen.queryByText(
          /this bill has not been assigned to a transport schedule yet/i,
        ),
      ).not.toBeInTheDocument();
    });

    it('renders the banner with role="note"', async () => {
      hookState = { ...hookState, bill: UNSCHEDULED_BILL };
      const Detail = await importBillOfLadingDetail();
      renderDetail(Detail);

      expect(screen.getByRole('note')).toBeInTheDocument();
    });
  });
});
