/**
 * Unit tests for src/pages/billOfLading/BillOfLading.tsx
 *
 * Covers:
 * - Renders correct column headers (Bill ID, Origin, Destination, Weight (kg), Status, Scheduled Date)
 * - Dash (—) displayed for null scheduledDate
 * - Empty state shows "No shipment bills found" when data=[] and !isLoading and !error
 * - Loading → skeleton rows shown (aria-busy table, no data rows rendered)
 * - Error state shows <ErrorState> with retry button that calls refetch
 * - Row click navigates to /bills/:id
 * - Status toggle (setFilters) called on filter change
 *
 * Requirements: 9.1, 9.5, 9.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { BillListItem, BillStatus } from '@/types/billOfLading';

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
// Mock useBills hook
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn();
const mockSetPage = vi.fn();
const mockSetSort = vi.fn();
const mockSetFilters = vi.fn();

const DEFAULT_HOOK_STATE = {
  data: [] as BillListItem[],
  totalPages: 0,
  isLoading: false,
  error: null as Error | null,
  refetch: mockRefetch,
  page: 1,
  sortField: undefined,
  sortDir: undefined,
  statuses: undefined as BillStatus[] | undefined,
  startDate: undefined,
  endDate: undefined,
  origin: undefined,
  destination: undefined,
  setPage: mockSetPage,
  setSort: mockSetSort,
  setFilters: mockSetFilters,
};

// Mutable reference so individual tests can override
let hookState = { ...DEFAULT_HOOK_STATE };

vi.mock('@/hooks/useBills', () => ({
  useBills: () => hookState,
}));

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

function buildBill(id: string, scheduledDate: string | null = '2024-06-01'): BillListItem {
  return {
    id,
    originWarehouse: 'Warehouse A',
    destinationWarehouse: 'Warehouse B',
    weightKg: 1200,
    status: 'Scheduled',
    scheduledDate,
  };
}

const SAMPLE_BILLS: BillListItem[] = [buildBill('B001'), buildBill('B002')];

// ---------------------------------------------------------------------------
// Helper — lazy import after mocks are hoisted
// ---------------------------------------------------------------------------

async function importBillOfLading() {
  const mod = await import('@/pages/billOfLading/BillOfLading');
  return mod.default;
}

function renderBillOfLading(
  BillOfLading: React.ComponentType,
  initialEntries: string[] = ['/bills'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BillOfLading />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BillOfLading page', () => {
  beforeEach(() => {
    hookState = {
      ...DEFAULT_HOOK_STATE,
      refetch: mockRefetch,
      setPage: mockSetPage,
      setSort: mockSetSort,
      setFilters: mockSetFilters,
    };
    mockRefetch.mockReset();
    mockSetPage.mockReset();
    mockSetSort.mockReset();
    mockSetFilters.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Column headers (Req 9.1) ───────────────────────────────────────────────

  describe('Column headers (Req 9.1)', () => {
    it('renders "Bill ID" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Bill ID is sortable → rendered as a button inside <th>
      expect(screen.getByRole('button', { name: /bill id/i })).toBeInTheDocument();
    });

    it('renders "Origin" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Origin is not sortable → plain columnheader text
      expect(screen.getByRole('columnheader', { name: /^origin$/i })).toBeInTheDocument();
    });

    it('renders "Destination" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByRole('columnheader', { name: /^destination$/i })).toBeInTheDocument();
    });

    it('renders "Weight (kg)" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Weight (kg) is sortable → rendered as a button
      expect(screen.getByRole('button', { name: /weight \(kg\)/i })).toBeInTheDocument();
    });

    it('renders "Status" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Status is sortable → button
      expect(screen.getByRole('button', { name: /^status$/i })).toBeInTheDocument();
    });

    it('renders "Scheduled Date" column header', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Scheduled Date is sortable → button
      expect(screen.getByRole('button', { name: /scheduled date/i })).toBeInTheDocument();
    });

    it('renders bill data rows with origin and destination warehouse', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // Both rows share the same warehouse values in fixture data
      const originCells = screen.getAllByText('Warehouse A');
      const destCells = screen.getAllByText('Warehouse B');
      expect(originCells.length).toBeGreaterThanOrEqual(1);
      expect(destCells.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Null scheduled date renders em-dash (Req 9.1) ─────────────────────────

  describe('Null scheduled date (Req 9.1)', () => {
    it('renders an em-dash (—) when scheduledDate is null', async () => {
      const billWithNullDate = buildBill('B-NULL', null);
      hookState = { ...hookState, data: [billWithNullDate], totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // The component renders: row.original.scheduledDate ?? '—'
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders the actual date string when scheduledDate is not null', async () => {
      const billWithDate = buildBill('B-DATE', '2024-09-15');
      hookState = { ...hookState, data: [billWithDate], totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByText('2024-09-15')).toBeInTheDocument();
    });
  });

  // ── Empty state (Req 9.5) ─────────────────────────────────────────────────

  describe('Empty state (Req 9.5)', () => {
    it('shows "No shipment bills found" heading when data=[] and !isLoading and !error', async () => {
      hookState = { ...hookState, data: [], isLoading: false, error: null };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByText(/no shipment bills found/i)).toBeInTheDocument();
    });

    it('shows helper text suggesting filter adjustment when data is empty', async () => {
      hookState = { ...hookState, data: [], isLoading: false, error: null };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
    });

    it('includes active filter description when status filter is set', async () => {
      hookState = {
        ...hookState,
        data: [],
        isLoading: false,
        error: null,
        statuses: ['Scheduled', 'In Transit'],
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      const helperText = screen.getByText(/active filters/i);
      expect(helperText).toHaveTextContent(/scheduled/i);
    });

    it('does NOT show "No shipment bills found" when there is data', async () => {
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.queryByText(/no shipment bills found/i)).not.toBeInTheDocument();
    });
  });

  // ── Skeleton loading state (Req 9.6) ──────────────────────────────────────

  describe('Skeleton loading state (Req 9.6)', () => {
    it('renders an aria-busy table while isLoading=true', async () => {
      hookState = { ...hookState, isLoading: true, data: [] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // SkeletonTable renders <table aria-busy="true" aria-label="Loading data">
      const loadingTable = screen.getByRole('table', { name: /loading data/i });
      expect(loadingTable).toBeInTheDocument();
      expect(loadingTable).toHaveAttribute('aria-busy', 'true');
    });

    it('does NOT show "No shipment bills found" while loading', async () => {
      hookState = { ...hookState, isLoading: true, data: [] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.queryByText(/no shipment bills found/i)).not.toBeInTheDocument();
    });

    it('does NOT show a Retry button while loading', async () => {
      hookState = { ...hookState, isLoading: true, data: [] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message when error is non-null', async () => {
      hookState = {
        ...hookState,
        error: new Error('Network failure'),
        isLoading: false,
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(
        screen.getByText(/failed to load shipment bills/i),
      ).toBeInTheDocument();
    });

    it('renders a role="alert" element in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders a Retry button in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('clicking Retry calls refetch', async () => {
      const user = userEvent.setup();
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does NOT render the data table when in error state', async () => {
      hookState = {
        ...hookState,
        error: new Error('Server error'),
        isLoading: false,
      };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      // The table + pagination section is gated by error === null
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('does NOT show error state when error is null', async () => {
      hookState = { ...hookState, error: null, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  // ── Row click navigation ───────────────────────────────────────────────────

  describe('Row click navigation', () => {
    it('navigates to /bills/:id when a row is clicked', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, data: SAMPLE_BILLS, totalPages: 1 };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      const rows = screen.getAllByRole('row', { name: /view row details/i });
      await user.click(rows[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/bills/B001');
    });
  });

  // ── Filter changes call setFilters (Req 9.8) ──────────────────────────────

  describe('Filter: status toggle calls setFilters (Req 9.8)', () => {
    it('calls setFilters when a status button is clicked', async () => {
      const user = userEvent.setup();
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      await user.click(screen.getByRole('button', { name: /^unscheduled$/i }));

      expect(mockSetFilters).toHaveBeenCalledTimes(1);
    });

    it('setFilters is called with the clicked status when no statuses are active', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: undefined };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      await user.click(screen.getByRole('button', { name: /^scheduled$/i }));

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['Scheduled'] }),
      );
    });

    it('setFilters is called with empty array when deselecting the only active status', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: ['Delivered'] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      await user.click(screen.getByRole('button', { name: /^delivered$/i }));

      // Deselecting the last status → next is [] → setFilters({ statuses: [] })
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: [] }),
      );
    });

    it('setFilters adds a status to existing selections', async () => {
      const user = userEvent.setup();
      hookState = { ...hookState, statuses: ['Scheduled'] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      await user.click(screen.getByRole('button', { name: /^in transit$/i }));

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: expect.arrayContaining(['Scheduled', 'In Transit']),
        }),
      );
    });

    it('all four status options are rendered as toggle buttons', async () => {
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      expect(screen.getByRole('button', { name: /^unscheduled$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^scheduled$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^in transit$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delivered$/i })).toBeInTheDocument();
    });

    it('active status toggle button has aria-pressed="true"', async () => {
      hookState = { ...hookState, statuses: ['Scheduled'] };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      const btn = screen.getByRole('button', { name: /^scheduled$/i });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('inactive status toggle button has aria-pressed="false"', async () => {
      hookState = { ...hookState, statuses: undefined };
      const BillOfLading = await importBillOfLading();
      renderBillOfLading(BillOfLading);

      const btn = screen.getByRole('button', { name: /^scheduled$/i });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
