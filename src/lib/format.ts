/**
 * Centralised formatting utilities.
 * Pure functions — no React, no imports from other app modules.
 */

function _parseSafe(iso: string): Date | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function _pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Returns the date portion in DD/MM HH:mm format.
 * If `iso` does not parse to a valid Date, returns `iso` unchanged.
 */
export function formatDateTimeShort(iso: string): string {
  const d = _parseSafe(iso);
  if (!d) return iso;
  return `${_pad(d.getDate())}/${_pad(d.getMonth() + 1)} ${_pad(d.getHours())}:${_pad(d.getMinutes())}`;
}

/**
 * Returns the date in DD/MM/YYYY HH:mm format.
 * If `iso` does not parse to a valid Date, returns `iso` unchanged.
 */
export function formatDateTimeFull(iso: string): string {
  const d = _parseSafe(iso);
  if (!d) return iso;
  return `${_pad(d.getDate())}/${_pad(d.getMonth() + 1)}/${d.getFullYear()} ${_pad(d.getHours())}:${_pad(d.getMinutes())}`;
}

/**
 * Formats a minute count as human-readable Vietnamese duration.
 * - 0 → "0 ph"
 * - exact-hour multiples → "Nh" (e.g. "1h", "2h")
 * - otherwise → "Nh Mph" (e.g. "1h 30ph")
 */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} ph`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}ph`;
}

/**
 * Removes a leading "Kho " prefix (case-insensitive) and trims.
 * "Kho Hà Nội" → "Hà Nội", "kho an giang" → "an giang", "Hanoi" → "Hanoi" (no-op).
 */
export function stripWarehousePrefix(name: string): string {
  return name.replace(/^Kho\s+/i, '').trim();
}
