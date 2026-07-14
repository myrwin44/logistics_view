import { QueryClient } from '@tanstack/react-query';

/**
 * Returns true when the error looks like an HTTP 4xx or 5xx response.
 * TanStack Query should NOT retry these because the server gave a definitive
 * answer; retrying would be wasteful and could mask real bugs.
 */
function isHttpClientOrServerError(error: unknown): boolean {
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    return status >= 400 && status < 600;
  }
  return false;
}

/**
 * Application-wide QueryClient singleton.
 *
 * Config:
 *  - staleTime  300 000 ms (5 min)  — cache is fresh; no refetch on focus/mount
 *  - gcTime     600 000 ms (10 min) — inactive cache is kept in memory
 *  - retry      function            — at most 1 retry, only for non-HTTP-4xx/5xx
 *                                    (retry: 1, exclude HTTP errors)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 600_000,
      gcTime: 900_000,
      // retry as a function: allow at most 1 attempt (failureCount 0 → first retry),
      // but never retry HTTP 4xx/5xx responses
      retry: (failureCount: number, error: unknown) =>
        failureCount < 1 && !isHttpClientOrServerError(error),
    },
  },
});
