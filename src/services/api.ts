/**
 * Base API client for the LGTS platform.
 * Handles Authorization header injection, 401 interception, and error normalisation.
 */

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// 401 logout callback (avoids circular import with AuthContext)
// ---------------------------------------------------------------------------

let _logoutCallback: (() => void) | null = null;

/** Called by AuthProvider during initialisation to wire 401 → logout. */
export function setLogoutCallback(fn: () => void): void {
  _logoutCallback = fn;
}

// ---------------------------------------------------------------------------
// Snowflake-safe JSON parser
// JavaScript's JSON.parse converts all JSON numbers to IEEE-754 float64.
// Snowflake IDs are 64-bit integers that exceed Number.MAX_SAFE_INTEGER
// (2^53 - 1 = 9007199254740991), so they lose precision (e.g. last digits
// become 0). Fix: parse the raw text, detect integer literals that are too
// large, and keep them as strings.
// ---------------------------------------------------------------------------

/** Regex: matches a JSON integer that exceeds MAX_SAFE_INTEGER (>15 digits or starts with 8/9 at 16+) */
const LARGE_INT_RE = /(?<!["\w])(-?\d{16,})(?!["\w.\d])/g;

/**
 * Parse a JSON string while preserving large integers as strings.
 * Replaces bare large integers in the raw text with quoted strings BEFORE
 * JSON.parse so the number is never touched by the JS parser.
 */
function safeParseJSON<T>(text: string): T {
  // Wrap large integers in quotes so JSON.parse keeps them as strings
  const safe = text.replace(LARGE_INT_RE, '"$1"');
  return JSON.parse(safe) as T;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('session_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  // 401 interception — expired / invalid session
  if (response.status === 401 && token) {
    _logoutCallback?.();
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (body as { message?: string }).message ?? response.statusText,
    );
  }

  // 204 No Content — return undefined cast to T so callers don't need to handle void
  if (response.status === 204) return undefined as T;

  // Use text → safeParseJSON to preserve Snowflake IDs (64-bit integers)
  const text = await response.text();
  return safeParseJSON<T>(text);
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

export const apiClient = {
  get: <T>(path: string) =>
    request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ---------------------------------------------------------------------------
// Query string helper
// ---------------------------------------------------------------------------

/**
 * Converts a params object to a URL query string, omitting keys whose value
 * is undefined, null, or an empty string.
 *
 * @example
 * toQueryString({ page: 1, status: 'Pending', dir: undefined })
 * // → "page=1&status=Pending"
 */
export function toQueryString(params: Record<string, unknown>): string {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
}
