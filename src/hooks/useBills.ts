/**
 * useBills hook — paginated, sorted, and filtered bill of lading list
 * backed by URL search params for bookmarkable, back-button-safe state.
 */

import { useState, useEffect, useCallback } from 'react';
import { billOfLadingService } from '../services/billOfLadingService';
import type { BillListItem, BillSortField, BillStatus } from '../types/billOfLading';
import type { SortDir } from '../types/transportTrip';
import { PAGE_SIZE } from '../lib/constants';
import { useUrlParams } from './useUrlParams';
import type { UrlParamsConfig } from './useUrlParams';

// ── Parsed URL state ──────────────────────────────────────────────────────────

/** Valid BillStatus values, used when parsing the URL param. */
const VALID_BILL_STATUSES: BillStatus[] = ['Unscheduled', 'Scheduled', 'In Transit', 'Delivered'];
/** Valid sort fields for bills, used when parsing the URL param. */
const VALID_BILL_SORT_FIELDS: BillSortField[] = ['id', 'weightKg', 'status', 'scheduledDate'];
/** Valid sort directions. */
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc'];

function parseBillStatuses(raw: string | null): BillStatus[] | undefined {
  if (!raw) return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is BillStatus => VALID_BILL_STATUSES.includes(s as BillStatus));
  return parsed.length > 0 ? parsed : undefined;
}

function parseBillSortField(raw: string | null): BillSortField | undefined {
  if (raw && VALID_BILL_SORT_FIELDS.includes(raw as BillSortField)) {
    return raw as BillSortField;
  }
  return undefined;
}

function parseSortDir(raw: string | null): SortDir | undefined {
  if (raw && VALID_SORT_DIRS.includes(raw as SortDir)) {
    return raw as SortDir;
  }
  return undefined;
}

// parsePage kept for completeness (was a private helper)
function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
// Suppress unused warning — kept intentionally as a private helper
void parsePage;

// ── BillFilters interface ─────────────────────────────────────────────────────

interface BillFilters extends Record<string, unknown> {
  statuses: BillStatus[] | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  origin: string | undefined;
  destination: string | undefined;
}

// ── Config ────────────────────────────────────────────────────────────────────

const billParamsConfig: UrlParamsConfig<BillFilters> = {
  parseFilters(params) {
    return {
      statuses: parseBillStatuses(params.get('status')),
      startDate: params.get('startDate') ?? undefined,
      endDate: params.get('endDate') ?? undefined,
      origin: params.get('origin') ?? undefined,
      destination: params.get('destination') ?? undefined,
    };
  },
  serializeFilters(params, partial) {
    if ('statuses' in partial) {
      if (partial.statuses && partial.statuses.length > 0) {
        params.set('status', partial.statuses.join(','));
      } else {
        params.delete('status');
      }
    }
    if ('startDate' in partial) {
      if (partial.startDate) {
        params.set('startDate', partial.startDate);
      } else {
        params.delete('startDate');
      }
    }
    if ('endDate' in partial) {
      if (partial.endDate) {
        params.set('endDate', partial.endDate);
      } else {
        params.delete('endDate');
      }
    }
    if ('origin' in partial) {
      if (partial.origin) {
        params.set('origin', partial.origin);
      } else {
        params.delete('origin');
      }
    }
    if ('destination' in partial) {
      if (partial.destination) {
        params.set('destination', partial.destination);
      } else {
        params.delete('destination');
      }
    }
    return params;
  },
  parseSortField: parseBillSortField,
  parseSortDir,
};

// ── Return type ───────────────────────────────────────────────────────────────

/**
 * Core data the hook returns per the spec.
 * Setters are exposed so the consuming page component can write URL state
 * through the same hook without importing useSearchParams itself.
 */
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
  sortDir: SortDir | undefined;
  statuses: BillStatus[] | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  origin: string | undefined;
  destination: string | undefined;
  // URL write-back helpers (resets page to 1 on filter/sort changes)
  setPage: (page: number) => void;
  setSort: (field: BillSortField | undefined, dir: SortDir | undefined) => void;
  setFilters: (filters: {
    statuses?: BillStatus[];
    startDate?: string;
    endDate?: string;
    origin?: string;
    destination?: string;
  }) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBills(): UseBillsResult {
  const {
    page,
    sortField,
    sortDir,
    filters,
    setPage,
    setSort,
    setFilters: setFiltersUrl,
  } = useUrlParams<BillFilters>(billParamsConfig);

  const { statuses, startDate, endDate, origin, destination } = filters;

  // Async state
  const [data, setData] = useState<BillListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Increment to trigger a manual refetch without changing URL params
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  // Stable string key for the statuses array so useEffect dependency comparison works
  const statusesKey = statuses?.join(',') ?? '';

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const typedSortField = sortField as BillSortField | undefined;
    const typedSortDir = sortDir as SortDir | undefined;

    billOfLadingService
      .getBills({
        page,
        pageSize: PAGE_SIZE,
        ...(typedSortField !== undefined ? { sortField: typedSortField } : {}),
        ...(typedSortDir !== undefined ? { sortDir: typedSortDir } : {}),
        ...(statuses !== undefined ? { status: statuses } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(origin !== undefined ? { originWarehouse: origin } : {}),
        ...(destination !== undefined ? { destinationWarehouse: destination } : {}),
      })
      .then((result) => {
        if (!cancelled) {
          setData(result.data);
          setTotalPages(result.totalPages);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortDir, statusesKey, startDate, endDate, origin, destination, fetchCount]);

  return {
    data,
    totalPages,
    isLoading,
    error,
    refetch,
    page,
    sortField: sortField as BillSortField | undefined,
    sortDir: sortDir as SortDir | undefined,
    statuses,
    startDate,
    endDate,
    origin,
    destination,
    setPage,
    setSort,
    setFilters: setFiltersUrl,
  };
}
