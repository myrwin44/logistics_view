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

// ─── Weight formatting ────────────────────────────────────────────────────────

/**
 * Formats a weight value (in kg) with smart unit selection:
 *  - < 1000 kg  → "X kg"       (e.g. "850 kg")
 *  - ≥ 1000 kg  → "X.XX tấn"   (e.g. "1.25 tấn", "4 482.79 tấn")
 *
 * The tấn value is always rounded to 2 decimal places.
 * Separators follow vi-VN locale (dots for thousands, comma for decimal).
 */
export function formatWeight(kg: number): string {
  if (kg == null || isNaN(kg)) return '—';
  if (kg < 1000) {
    return `${kg.toLocaleString('vi-VN')} kg`;
  }
  const ton = kg / 1000;
  return `${ton.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tấn`;
}

/**
 * Compact weight for chart axes / tight spaces — no locale separator:
 *  - < 1000 kg  → "850 kg"
 *  - ≥ 1000 kg  → "1 tấn" (integer only, no decimals)
 * Absolute value is used so negative diverging-chart values display correctly.
 */
export function formatWeightCompact(kg: number): string {
  if (kg == null || isNaN(kg)) return '—';
  const abs = Math.abs(kg);
  if (abs < 1000) return `${abs} kg`;
  const ton = abs / 1000;
  return `${Math.floor(ton)} tấn`;
}
