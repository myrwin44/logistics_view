import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Describes how to convert a filter object to/from URL search params.
 *
 * @template TFilter - The caller's typed filter object (e.g. BillFilters, TripFilters).
 */
export interface UrlParamsConfig<TFilter extends Record<string, unknown>> {
  /**
   * Parse raw URLSearchParams into a typed filter object.
   * Called on every render to derive the current filter state.
   */
  parseFilters: (params: URLSearchParams) => TFilter;

  /**
   * Serialise a partial filter update into a URLSearchParams mutation function.
   * Receives the current URLSearchParams and returns a mutated copy.
   * Any key that should be cleared must delete the corresponding param.
   */
  serializeFilters: (params: URLSearchParams, filters: Partial<TFilter>) => URLSearchParams;

  /**
   * Parse the `sort` URL param into the caller's sort-field type.
   * Returns undefined when the param is absent or invalid.
   */
  parseSortField: (raw: string | null) => string | undefined;

  /**
   * Parse the `dir` URL param.
   * Returns undefined when absent or invalid.
   */
  parseSortDir: (raw: string | null) => 'asc' | 'desc' | undefined;
}

/**
 * The read/write state returned by `useUrlParams`.
 *
 * @template TFilter - The caller's typed filter object.
 */
export interface UrlParamsState<TFilter extends Record<string, unknown>> {
  // Read state
  page: number;
  sortField: string | undefined;
  sortDir: 'asc' | 'desc' | undefined;
  filters: TFilter;
  // Write helpers
  /** Updates only the `page` URL param. */
  setPage: (page: number) => void;
  /** Updates `sort` and `dir` URL params and resets `page` to `1`. */
  setSort: (field: string | undefined, dir: 'asc' | 'desc' | undefined) => void;
  /** Serialises a partial filter update into the URL and resets `page` to `1`. */
  setFilters: (filters: Partial<TFilter>) => void;
}

/**
 * Generic hook that centralises URL search-param read/write for paginated,
 * sortable, filterable lists.
 *
 * Parsing logic is supplied by the caller via `config` so this hook has no
 * knowledge of domain-specific param names or value shapes.
 */
export function useUrlParams<TFilter extends Record<string, unknown>>(
  config: UrlParamsConfig<TFilter>,
): UrlParamsState<TFilter> {
  const [searchParams, setSearchParams] = useSearchParams();
  const { parseFilters, serializeFilters, parseSortField, parseSortDir } = config;

  // --- read state ---

  const pageRaw = searchParams.get('page');
  const pageNum = Number(pageRaw);
  const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;

  const sortField = parseSortField(searchParams.get('sort'));
  const sortDir = parseSortDir(searchParams.get('dir'));

  const filters = parseFilters(searchParams);

  // --- stable write helpers ---

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(newPage));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (field: string | undefined, dir: 'asc' | 'desc' | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          field !== undefined ? next.set('sort', field) : next.delete('sort');
          dir !== undefined ? next.set('dir', dir) : next.delete('dir');
          next.set('page', '1'); // Reset page on sort change (Req 2.4)
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (partial: Partial<TFilter>) => {
      setSearchParams(
        (prev) => {
          const next = serializeFilters(new URLSearchParams(prev), partial);
          next.set('page', '1'); // Reset page on filter change
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, serializeFilters],
  );

  return { page, sortField, sortDir, filters, setPage, setSort, setFilters };
}
