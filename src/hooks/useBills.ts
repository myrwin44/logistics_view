/**
 * useBills hook — paginated, sorted, and filtered bill of lading list
 * backed by URL search params for bookmarkable, back-button-safe state.
 * Powered by TanStack Query for caching (staleTime 10 min).
 */

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { billOfLadingService } from '../services/billOfLadingService';
import type { BillListItem, BillSortField, BillStatus } from '../types/billOfLading';
import { PAGE_SIZE } from '../lib/constants';
import { useUrlParams } from './useUrlParams';
import type { UrlParamsConfig } from './useUrlParams';

// ── Parsed URL state ──────────────────────────────────────────────────────────

/** Valid BillStatus values, used when parsing the URL param. */
const VALID_BILL_STATUSES: BillStatus[] = ['ESTIMATED', 'MODIFIED', 'ACTUAL'];
/** Valid sort fields for bills, used when parsing the URL param. */
const VALID_BILL_SORT_FIELDS: BillSortField[] = ['id', 'actualWeight'];

function parseBillStatus(raw: string | null): BillStatus | undefined {
  if (raw && VALID_BILL_STATUSES.includes(raw as BillStatus)) {
    return raw as BillStatus;
  }
  return undefined;
}

function parseBillSortField(raw: string | null): BillSortField | undefined {
  if (raw && VALID_BILL_SORT_FIELDS.includes(raw as BillSortField)) {
    return raw as BillSortField;
  }
  return undefined;
}

function parseSortDir(raw: string | null): 'asc' | 'desc' | undefined {
  if (raw === 'asc' || raw === 'desc') {
    return raw;
  }
  return undefined;
}

function parseNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

function parseString(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ── BillFilters interface ─────────────────────────────────────────────────────

interface BillFilters extends Record<string, unknown> {
  status: BillStatus | undefined;
  id: string | undefined;
  warehouseId: number | undefined;
  transportTripId: string | undefined;
}

// ── Config ────────────────────────────────────────────────────────────────────

const billParamsConfig: UrlParamsConfig<BillFilters> = {
  parseFilters(params) {
    return {
      status: parseBillStatus(params.get('status')),
      id: parseString(params.get('id')),
      warehouseId: parseNumber(params.get('warehouseId')),
      transportTripId: parseString(params.get('transportTripId')),
    };
  },
  serializeFilters(params, partial) {
    if ('status' in partial) {
      if (partial.status) {
        params.set('status', partial.status);
      } else {
        params.delete('status');
      }
    }
    if ('id' in partial) {
      if (partial.id !== undefined) {
        params.set('id', partial.id);
      } else {
        params.delete('id');
      }
    }
    if ('warehouseId' in partial) {
      if (partial.warehouseId !== undefined) {
        params.set('warehouseId', partial.warehouseId.toString());
      } else {
        params.delete('warehouseId');
      }
    }
    if ('transportTripId' in partial) {
      if (partial.transportTripId !== undefined) {
        params.set('transportTripId', partial.transportTripId);
      } else {
        params.delete('transportTripId');
      }
    }
    return params;
  },
  parseSortField: parseBillSortField,
  parseSortDir,
};

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseBillsResult {
  // Data
  data: BillListItem[];
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  // Current parsed URL params (read-side, useful for controlled UI)
  page: number;
  sortField: BillSortField | undefined;
  status: BillStatus | undefined;
  id: string | undefined;
  warehouseId: number | undefined;
  transportTripId: string | undefined;
  /** true once the user has explicitly triggered a search */
  hasSearched: boolean;
  // URL write-back helpers (resets page to 1 on filter/sort changes)
  setPage: (page: number) => void;
  setSort: (field: BillSortField | undefined, dir: 'asc' | 'desc' | undefined) => void;
  setFilters: (filters: {
    status?: BillStatus;
    id?: string;
    warehouseId?: number;
    transportTripId?: string;
  }) => void;
  /** Clears all filters and resets the hasSearched flag */
  clearFilters: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBills(): UseBillsResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    page,
    sortField,
    filters,
    setPage,
    setSort,
  } = useUrlParams<BillFilters>(billParamsConfig);

  const { status, id, warehouseId, transportTripId } = filters;

  // `s=1` in the URL means the user has explicitly triggered a search
  const hasSearched = searchParams.get('s') === '1';

  // Stable string key for filters to avoid unnecessary cache invalidations
  const filtersKey = `${status ?? ''}-${id ?? ''}-${warehouseId ?? ''}-${transportTripId ?? ''}`;

  // ── TanStack Query — only runs after user presses "Tìm" ──────────────────
  const {
    data: queryData,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['bills', page, sortField, filtersKey],
    queryFn: () => {
      const typedSortField = sortField as BillSortField | undefined;
      const sort = typedSortField ? `${typedSortField},desc` : undefined;

      return billOfLadingService.getBills({
        page,
        size: PAGE_SIZE,
        ...(sort !== undefined ? { sort } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(id !== undefined ? { id } : {}),
        ...(warehouseId !== undefined ? { warehouseId } : {}),
        ...(transportTripId !== undefined ? { transportTripId } : {}),
      });
    },
    enabled: hasSearched,
  });

  const totalPages = queryData && queryData.totalElements > 0
    ? Math.ceil(queryData.totalElements / queryData.limit)
    : 0;

  // Apply filters and set s=1 flag — single atomic URL write to avoid race condition
  // (calling setFiltersUrl then setSearchParams separately causes the second write
  //  to overwrite the first because both snapshot the same stale URLSearchParams)
  function setFilters(f: {
    status?: BillStatus;
    id?: string;
    warehouseId?: number;
    transportTripId?: string;
  }) {
    setSearchParams((prev) => {
      // Use the config serializer to apply filter values, then add s=1
      const next = billParamsConfig.serializeFilters(new URLSearchParams(prev.toString()), f);
      next.set('page', '0');
      next.set('s', '1');
      return next;
    }, { replace: true });
  }

  // Clear filters and remove the s flag so the prompt reappears — single write
  function clearFilters() {
    setSearchParams((prev) => {
      const next = billParamsConfig.serializeFilters(new URLSearchParams(prev.toString()), {
        status: undefined,
        id: undefined,
        warehouseId: undefined,
        transportTripId: undefined,
      });
      next.delete('s');
      next.set('page', '0');
      return next;
    }, { replace: true });
  }

  return {
    data: queryData?.data ?? [],
    totalPages,
    isLoading: isFetching,
    error: queryError as Error | null,
    refetch,
    page,
    sortField: sortField as BillSortField | undefined,
    status,
    id,
    warehouseId,
    transportTripId,
    hasSearched,
    setPage,
    setSort,
    setFilters,
    clearFilters,
  };
}
