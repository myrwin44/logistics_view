/**
 * Unit tests for src/pages/transportTrip/TransportTripDetail.tsx
 *
 * Covers:
 * - Req 7.1: Header renders Trip ID, vehicle name + plate, StatusBadge,
 *            scheduled date, total weight (kg), and total shipment bill count.
 * - Req 7.2: TripStopTimeline renders all stops in order (sequence, warehouse
 *            name, arrival/departure times).
 * - Req 7.4: isLoading=true shows skeleton header and skeleton timeline.
 * - Req 7.5: 404 notFound → "Transport trip not found" + back link to
 *            /transport-trips.
 * - Error state: ErrorState component rendered when error is non-null.
 *
 * Requirements: 7.1, 7.2, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { TransportTrip } from '@/types/transportTrip';
import type { TripStop } from '@/types/tripStop';
import type { UseTransportTripDetailResult } from '@/hooks/useTransportTripDetail';

// ---------------------------------------------------------------------------
// Mock react-router-dom useParams so we control the :id param
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'TRIP-001' }),
  };
});

// ---------------------------------------------------------------------------
// Mock useTransportTripDetail hook
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();

const DEFAULT_HOOK_STATE: UseTransportTripDetailResult = {
  trip: null,
  stops: [],
  isLoading: false,
  notFound: false,
  error: null,
  refetch: mockRefetch,
};

let hookState: UseTransportTripDetailResult = { ...DEFAULT_HOOK_STATE };

vi.mock('@/hooks/useTransportTripDetail', () => ({
  useTransportTripDetail: () => hookState,
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

const SAMPLE_TRIP: TransportTrip = {
  id: 'TRIP-001',
  vehicle: { name: 'Truck Alpha', plateNumber: 'ABC-1234' },
  status: 'In Progress',
  originWarehouse: 'Warehouse A',
  destinationWarehouse: 'Warehouse B',
  scheduledDate: '2024-06-15',
  shipmentCount: 5,
  totalWeightKg: 2500,
  stops: [],
};

function buildStop(sequence: number, warehouseName: string): TripStop {
  return {
    id: `stop-${sequence}`,
    tripId: 'TRIP-001',
    sequence,
    warehouseName,
    warehouseLocation: `Location ${sequence}`,
    scheduledArrival: '2024-06-15T08:00:00Z',
    scheduledDeparture: '2024-06-15T09:00:00Z',
    loadedBills: [],
    unloadedBills: [],
  };
}

const SAMPLE_STOPS: TripStop[] = [
  buildStop(1, 'Warehouse Alpha'),
  buildStop(2, 'Warehouse Beta'),
  buildStop(3, 'Warehouse Gamma'),
];

// ---------------------------------------------------------------------------
// Helper — lazy import after mocks are hoisted
// ---------------------------------------------------------------------------

async function importTransportTripDetail() {
  const mod = await import('@/pages/transportTrip/TransportTripDetail');
  return mod.default;
}

function renderDetail(Component: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={['/transport-trips/TRIP-001']}>
      <Component />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransportTripDetail page', () => {
  beforeEach(() => {
    hookState = { ...DEFAULT_HOOK_STATE, refetch: mockRefetch };
    mockRefetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Req 7.1: Header fields ─────────────────────────────────────────────────

  describe('Header fields (Req 7.1)', () => {
    it('renders the Trip ID in the heading', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByRole('heading', { name: /TRIP-001/i })).toBeInTheDocument();
    });

    it('renders the vehicle name', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
    });

    it('renders the vehicle plate number', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByText(/ABC-1234/)).toBeInTheDocument();
    });

    it('renders the StatusBadge with the trip status', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // StatusBadge renders a <span role="status" aria-label="In Progress">
      expect(screen.getByRole('status', { name: /in progress/i })).toBeInTheDocument();
    });

    it('renders the formatted scheduled date', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // formatDate is mocked to return '2024-06-15'
      expect(screen.getByText('2024-06-15')).toBeInTheDocument();
    });

    it('renders the total weight in kg', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // The weight value is displayed as "2,500" with a "kg" unit nearby
      expect(screen.getByText(/2[,.]?500/)).toBeInTheDocument();
      expect(screen.getByText('kg')).toBeInTheDocument();
    });

    it('renders the shipment bill count', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // shipmentCount is 5, rendered as "5" with label "bills"
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('bills')).toBeInTheDocument();
    });

    it('renders singular "bill" when shipmentCount is 1', async () => {
      const singleBillTrip: TransportTrip = { ...SAMPLE_TRIP, shipmentCount: 1 };
      hookState = { ...hookState, trip: singleBillTrip, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByText('bill')).toBeInTheDocument();
      expect(screen.queryByText('bills')).not.toBeInTheDocument();
    });
  });

  // ── Req 7.2: Timeline renders all stops in order ───────────────────────────

  describe('TripStopTimeline renders stops in order (Req 7.2)', () => {
    it('renders the "Route" section heading', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: SAMPLE_STOPS };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByRole('heading', { name: /route/i })).toBeInTheDocument();
    });

    it('renders all three stop headings', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: SAMPLE_STOPS };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByText(/Stop 1 — Warehouse Alpha/)).toBeInTheDocument();
      expect(screen.getByText(/Stop 2 — Warehouse Beta/)).toBeInTheDocument();
      expect(screen.getByText(/Stop 3 — Warehouse Gamma/)).toBeInTheDocument();
    });

    it('renders stops in ascending sequence order regardless of input order', async () => {
      // Provide stops in reverse order — timeline should sort them
      const reversedStops = [...SAMPLE_STOPS].reverse();
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: reversedStops };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      const stopHeadings = screen.getAllByText(/Stop \d+ —/);
      expect(stopHeadings[0]).toHaveTextContent('Stop 1 —');
      expect(stopHeadings[1]).toHaveTextContent('Stop 2 —');
      expect(stopHeadings[2]).toHaveTextContent('Stop 3 —');
    });

    it('renders sequence numbers as circle markers in the timeline', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: SAMPLE_STOPS };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // TripStopTimeline renders sequence numbers inside the spine circles
      const timeline = screen.getByRole('list', { name: /trip stop timeline/i });
      expect(timeline).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('renders arrival and departure time labels for each stop', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: SAMPLE_STOPS };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // Each stop has an Arrival and Departure label
      const arrivalLabels = screen.getAllByText(/arrival:/i);
      const departureLabels = screen.getAllByText(/departure:/i);
      expect(arrivalLabels).toHaveLength(3);
      expect(departureLabels).toHaveLength(3);
    });

    it('shows "No stops available" when stops array is empty', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [] };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByText(/no stops available/i)).toBeInTheDocument();
    });
  });

  // ── Req 7.4: Skeleton loading state ───────────────────────────────────────

  describe('Skeleton loading state (Req 7.4)', () => {
    it('renders an aria-busy element for the trip header while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // SkeletonTripHeader renders a div with aria-label="Loading trip details"
      expect(screen.getByLabelText(/loading trip details/i)).toBeInTheDocument();
    });

    it('renders an aria-busy element for the timeline while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      // SkeletonTimeline renders a div with aria-label="Loading trip stops"
      expect(screen.getByLabelText(/loading trip stops/i)).toBeInTheDocument();
    });

    it('does NOT render the trip heading while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('heading', { name: /trip trip-001/i }),
      ).not.toBeInTheDocument();
    });

    it('does NOT render the not-found state while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.queryByText(/transport trip not found/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Req 7.5: 404 / not-found state ────────────────────────────────────────

  describe('Not-found state (Req 7.5)', () => {
    it('renders "Transport trip not found" message when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.getByText(/transport trip not found/i),
      ).toBeInTheDocument();
    });

    it('renders a back link pointing to /transport-trips when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      const backLink = screen.getByRole('link', { name: /back to transport trips/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/transport-trips');
    });

    it('does NOT render the trip header when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('heading', { level: 1 }),
      ).not.toBeInTheDocument();
    });

    it('does NOT render the timeline when notFound=true', async () => {
      hookState = { ...hookState, notFound: true };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('list', { name: /trip stop timeline/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('renders an error message when error is non-null', async () => {
      hookState = {
        ...hookState,
        error: new Error('Network failure'),
        isLoading: false,
      };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.getByText(/failed to load transport trip details/i),
      ).toBeInTheDocument();
    });

    it('renders a role="alert" element in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders a Retry button in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('does NOT render the trip header in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(
        screen.queryByRole('heading', { level: 1 }),
      ).not.toBeInTheDocument();
    });

    it('does NOT render the error state when error is null', async () => {
      hookState = { ...hookState, trip: SAMPLE_TRIP, stops: [], error: null };
      const Detail = await importTransportTripDetail();
      renderDetail(Detail);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
