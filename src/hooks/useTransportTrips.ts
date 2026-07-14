/**
 * useTransportTrips hook — paginated, sorted, and filtered transport trip list
 * backed by URL search params for bookmarkable, back-button-safe state.
 * Powered by TanStack Query for caching (staleTime 5 min).
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transportTripService } from '../services/transportTripService';
import type { TripListItem, TripSortField, SortDir, TripStatus } from '../types/transportTrip';
import { PAGE_SIZE } from '../lib/constants';
import { useUrlParams } from './useUrlParams';
import type { UrlParamsConfig } from './useUrlParams';

// ── Parsed URL state ──────────────────────────────────────────────────────────

/** Valid TripStatus values, used when parsing the URL param. */
const VALID_STATUSES: TripStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
/** Valid sort fields, used when parsing the URL param. */
const VALID_SORT_FIELDS: TripSortField[] = ['id', 'scheduledDate', 'status', 'vehicleName'];
/** Valid sort directions. */
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc'];

function parseStatuses(raw: string | null): TripStatus[] | undefined {
  if (!raw) return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is TripStatus => VALID_STATUSES.includes(s as TripStatus));
  return parsed.length > 0 ? parsed : undefined;
}

function parseSortField(raw: string | null): TripSortField | undefined {
  if (raw && VALID_SORT_FIELDS.includes(raw as TripSortField)) {
    return raw as TripSortField;
  }
  return undefined;
}

function parseSortDir(raw: string | null): SortDir | undefined {
  if (raw && VALID_SORT_DIRS.includes(raw as SortDir)) {
    return raw as SortDir;
  }
  return undefined;
}

// ── TripFilters interface ─────────────────────────────────────────────────────

interface TripFilters extends Record<string, unknown> {
  statuses: TripStatus[] | undefined;
}

// ── Config ────────────────────────────────────────────────────────────────────

const tripParamsConfig: UrlParamsConfig<TripFilters> = {
  parseFilters(params) {
    return {
      statuses: parseStatuses(params.get('status')),
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
    return params;
  },
  parseSortField,
  parseSortDir,
};

// ── Params ────────────────────────────────────────────────────────────────────

export interface UseTransportTripsParams {
  /** ISO YYYY-MM-DD. Supplied by consumer (e.g. from globalDateRange). */
  startDate?: string;
  /** ISO YYYY-MM-DD. Supplied by consumer (e.g. from globalDateRange). */
  endDate?: string;
}

// ── Return type ───────────────────────────────────────────────────────────────

/**
 * Setters write back to URL search params so the state is bookmarkable
 * and survives back-button navigation.
 */
export interface UseTransportTripsResult {
  // Data
  trips: TripListItem[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  // Current parsed URL params (read-side)
  page: number;
  sortField: TripSortField | undefined;
  sortDir: SortDir | undefined;
  statuses: TripStatus[] | undefined;
  // URL write-back helpers
  setPage: (page: number) => void;
  setSortField: (field: TripSortField | undefined) => void;
  setSortDir: (dir: SortDir | undefined) => void;
  setStatuses: (statuses: TripStatus[] | undefined) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTransportTrips(
  params: UseTransportTripsParams = {},
): UseTransportTripsResult {
  const { startDate, endDate } = params;

  const {
    page,
    sortField,
    sortDir,
    filters,
    setPage,
    setSort,
    setFilters,
  } = useUrlParams<TripFilters>(tripParamsConfig);

  const { statuses } = filters;

  // Stable string key for the statuses array (array identity changes every render)
  const statusesKey = statuses?.join(',') ?? '';

  // ── TanStack Query — cache key includes all 6 params ─────────────
  const {
    data: queryData,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [
      'transport-trips',
      page,
      sortField,
      sortDir,
      statusesKey,
      startDate ?? '',
      endDate ?? '',
    ],
    queryFn: () => {
      const typedSortField = sortField as TripSortField | undefined;
      const typedSortDir = sortDir as SortDir | undefined;
      return transportTripService.getTrips({
        page,
        pageSize: PAGE_SIZE,
        ...(typedSortField !== undefined ? { sortField: typedSortField } : {}),
        ...(typedSortDir !== undefined ? { sortDir: typedSortDir } : {}),
        ...(statuses !== undefined ? { status: statuses } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
    },
  });

  // ── Reconstruct legacy separate setters from combined setSort/setFilters ────

  /** Change the sort field. Resets page to 1 */
  const setSortField = useCallback(
    (field: TripSortField | undefined) => setSort(field, sortDir),
    [setSort, sortDir],
  );

  /** Change the sort direction. Resets page to 1 */
  const setSortDir = useCallback(
    (dir: SortDir | undefined) => setSort(sortField, dir),
    [setSort, sortField],
  );

  /** Change the status multi-select filter. Resets page to 1 */
  const setStatuses = useCallback(
    (newStatuses: TripStatus[] | undefined) => setFilters({ statuses: newStatuses }),
    [setFilters],
  );

  return {
    trips: queryData?.data ?? [],
    total: queryData?.totalPages ?? 0,
    isLoading: isFetching,
    error: queryError as Error | null,
    refetch,
    page,
    sortField: sortField as TripSortField | undefined,
    sortDir: sortDir as SortDir | undefined,
    statuses,
    setPage,
    setSortField,
    setSortDir,
    setStatuses,
  };
}
