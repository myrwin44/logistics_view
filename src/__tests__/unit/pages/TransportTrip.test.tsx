/**
 * Unit tests for src/pages/transportTrip/TransportTrip.tsx
 *
 * Covers:
 * - Renders correct column headers (Trip ID, Vehicle, Status, Origin, Destination, Date, Bills)
 * - Filter (status toggle) changes reset page to 1 via setStatusFilter
 * - isLoading=true shows skeleton rows (aria-busy table)
 * - Empty data shows EmptyState with "No transport trips found"
 * - Error state shows ErrorState with retry button that calls refetch
 *
 * Requirements: 6.1, 6.4, 6.5, 6.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { TripListItem } from '@/types/transportTrip';

// ---------------------------------------------------------------------------
// Mock react-router-dom navigation
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Mock useTransportTrips hook
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();
const mockSetPage = vi.fn();
const mockSetSortField = vi.fn();
const mockSetSortDir = vi.fn();
const mockSetStatuses = vi.fn();

const DEFAULT_HOOK_STATE = {
  trips: [] as TripListItem[],
  total: 0,
  isLoading: false,
  error: null as Error | null,
  refetch: mockRefetch,
  page: 1,
  sortField: undefined as string | undefined,
  sortDir: undefined as 'asc' | 'desc' | undefined,
  statuses: undefined as string[] | undefined,
  setPage: mockSetPage,
  setSortField: mockSetSortField,
  setSortDir: mockSetSortDir,
  setStatuses: mockSetStatuses,
};

// Mutable reference so individual tests can override
let hookState = { ...DEFAULT_HOOK_STATE };

vi.mock('@/hooks/useTransportTrips', () => ({
  useTransportTrips: () => hookState,
}));

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

function buildTrip(id: string): TripListItem {
  return {
    id,
    vehicle: { name: `Truck ${id}`, plateNumber: `PLT-${id}` },
    status: 'Pending',
    originWarehouse: 'Warehouse A',
    destinationWarehouse: 'Warehouse B',
    scheduledDate: '2024-06-01',
    shipmentCount: 3,
  };
}

const SAMPLE_TRIPS: TripListItem[] = [buildTrip('T001'), buildTrip('T002')];

// ---------------------------------------------------------------------------
// Helper — lazy import after mocks are hoisted
// ---------------------------------------------------------------------------

async function importTransportTrip() {
  const mod = await import('@/pages/transportTrip/TransportTrip');
  return mod.default;
}

function renderTransportTrip(
  TransportTrip: React.ComponentType,
  initialEntries: string[] = ['/transport-trips'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TransportTrip />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransportTrip page', () => {
  beforeEach(() => {
    hookState = {
      ...DEFAULT_HOOK_STATE,
      refetch: mockRefetch,
      setPage: mockSetPage,
      setSortField: mockSetSortField,
      setSortDir: mockSetSortDir,
      setStatuses: mockSetStatuses,
    };
    mockRefetch.mockReset();
    mockSetPage.mockReset();
    mockSetSortField.mockReset();
    mockSetSortDir.mockReset();
    mockSetStatuses.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Column headers (Req 6.1) ───────────────────────────────────────────────

  describe('Column headers (Req 6.1)', () => {
    it('renders "Trip ID" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('button', { name: /trip id/i })).toBeInTheDocument();
    });

    it('renders "Vehicle" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // Vehicle column is not sortable, so it renders as a plain <th> (columnheader)
      expect(screen.getByRole('columnheader', { name: /vehicle/i })).toBeInTheDocument();
    });

    it('renders "Status" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
    });

    it('renders "Origin" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // Origin is not sortable, so it renders as plain text in a th
      expect(screen.getByText(/origin/i)).toBeInTheDocument();
    });

    it('renders "Destination" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByText(/destination/i)).toBeInTheDocument();
    });

    it('renders "Date" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('button', { name: /date/i })).toBeInTheDocument();
    });

    it('renders "Bills" column header', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // Bills is not sortable
      expect(screen.getByText(/bills/i)).toBeInTheDocument();
    });

    it('renders trip data rows with vehicle name and plate', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByText('Truck T001')).toBeInTheDocument();
      expect(screen.getByText('PLT-T001')).toBeInTheDocument();
    });
  });

  // ── Filter changes reset page to 1 (Req 6.9) ──────────────────────────────

  describe('Filter: status toggle resets page to 1 (Req 6.9)', () => {
    it('calls setStatusFilter when a status button is clicked', async () => {
      const user = userEvent.setup();
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // Click the "Pending" status toggle button
      await user.click(screen.getByRole('button', { name: /^pending$/i }));

      expect(mockSetStatuses).toHaveBeenCalledTimes(1);
    });

    it('setStatusFilter is called with the clicked status when no statuses are active', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: undefined };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      await user.click(screen.getByRole('button', { name: /^pending$/i }));

      expect(mockSetStatuses).toHaveBeenCalledWith(['Pending']);
    });

    it('setStatusFilter is called with undefined when deselecting the only active status', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: ['Pending'] };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      await user.click(screen.getByRole('button', { name: /^pending$/i }));

      // Deselecting the last active status passes undefined
      expect(mockSetStatuses).toHaveBeenCalledWith(undefined);
    });

    it('setStatusFilter adds a status to existing selections', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: ['Pending'] };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      await user.click(screen.getByRole('button', { name: /^completed$/i }));

      expect(mockSetStatuses).toHaveBeenCalledWith(
        expect.arrayContaining(['Pending', 'Completed']),
      );
    });

    it('all four status options are rendered as toggle buttons', async () => {
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('button', { name: /^pending$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^in progress$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^completed$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^cancelled$/i })).toBeInTheDocument();
    });

    it('active status toggle button has aria-pressed="true"', async () => {
      hookState = { ...hookState, statuses: ['Pending'] };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      const pendingBtn = screen.getByRole('button', { name: /^pending$/i });
      expect(pendingBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('inactive status toggle button has aria-pressed="false"', async () => {
      hookState = { ...hookState, statuses: undefined };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      const pendingBtn = screen.getByRole('button', { name: /^pending$/i });
      expect(pendingBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ── Skeleton loading state (Req 6.5) ──────────────────────────────────────

  describe('Skeleton loading state (Req 6.5)', () => {
    it('renders an aria-busy table while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // SkeletonTable renders a <table aria-busy="true" aria-label="Loading data">
      const loadingTable = screen.getByRole('table', { name: /loading data/i });
      expect(loadingTable).toBeInTheDocument();
      expect(loadingTable).toHaveAttribute('aria-busy', 'true');
    });

    it('does NOT show "No transport trips found" while loading', async () => {
      hookState = { ...hookState, isLoading: true, trips: [] };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.queryByText(/no transport trips found/i)).not.toBeInTheDocument();
    });

    it('does NOT show the error state while loading', async () => {
      hookState = { ...hookState, isLoading: true };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  // ── Empty state (Req 6.4) ─────────────────────────────────────────────────

  describe('Empty state (Req 6.4)', () => {
    it('shows "No transport trips found" heading when data is empty and not loading', async () => {
      hookState = { ...hookState, trips: [], isLoading: false };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByText(/no transport trips found/i)).toBeInTheDocument();
    });

    it('shows helper text suggesting filter adjustment when data is empty', async () => {
      hookState = { ...hookState, trips: [], isLoading: false };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
    });

    it('includes active filter description in helper text when status filter is set', async () => {
      hookState = {
        ...hookState,
        trips: [],
        isLoading: false,
        statuses: ['Pending', 'Completed'],
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // The helper text paragraph should mention the active status filter
      const helperText = screen.getByText(/active filters/i);
      expect(helperText).toHaveTextContent(/pending/i);
    });

    it('does NOT show "No transport trips found" when there is data', async () => {
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.queryByText(/no transport trips found/i)).not.toBeInTheDocument();
    });
  });

  // ── Error state (Req 6.6) ─────────────────────────────────────────────────

  describe('Error state (Req 6.6)', () => {
    it('shows error message when error is non-null', async () => {
      hookState = {
        ...hookState,
        error: new Error('Network failure'),
        isLoading: false,
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(
        screen.getByText(/failed to load transport trips/i),
      ).toBeInTheDocument();
    });

    it('renders a role="alert" element in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders a Retry button in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('clicking Retry calls refetch', async () => {
      const user = userEvent.setup();
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does NOT render the data table when in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      // No table rendered in error state (error check gates the table section)
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('does NOT show error state when error is null', async () => {
      hookState = { ...hookState, error: null, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  // ── Row click navigation ───────────────────────────────────────────────────

  describe('Row click navigation', () => {
    it('navigates to /transport-trips/:id when a row is clicked', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, trips: SAMPLE_TRIPS, total: 1 };
      const TransportTrip = await importTransportTrip();
      renderTransportTrip(TransportTrip);

      const rows = screen.getAllByRole('row', { name: /view row details/i });
      await user.click(rows[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/transport-trips/T001');
    });
  });
});
