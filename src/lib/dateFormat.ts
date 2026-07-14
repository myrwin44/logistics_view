import { format, subDays, startOfMonth } from 'date-fns';
import type { DateFormat, DefaultDateRange } from '../types/settings';

/** Maps the app DateFormat union to date-fns format tokens. */
const DATE_FORMAT_MAP: Record<DateFormat, string> = {
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
};

/**
 * Formats a date value using the user's selected DateFormat preference.
 *
 * @param date - A Date object or an ISO date/datetime string.
 * @param fmt  - The DateFormat enum value from user settings.
 * @returns    A formatted date string matching the requested format.
 */
export function formatDate(date: Date | string, fmt: DateFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, DATE_FORMAT_MAP[fmt]);
}

/**
 * Resolves a DefaultDateRange preference to a concrete { startDate, endDate } pair
 * where both values are ISO date strings (YYYY-MM-DD).
 *
 * Implementations for all four DefaultDateRange values use date-fns helpers.
 * Full implementations will be completed in task 2.1.
 *
 * @param pref - The user's DefaultDateRange preference.
 * @returns    An object with startDate and endDate as ISO YYYY-MM-DD strings.
 */
export function resolveDefaultDateRange(pref: DefaultDateRange): { startDate: string; endDate: string } {
  const today = new Date();
  const end = format(today, 'yyyy-MM-dd');

  switch (pref) {
    case 'last7':
      return { startDate: format(subDays(today, 7), 'yyyy-MM-dd'), endDate: end };
    case 'last30':
      return { startDate: format(subDays(today, 30), 'yyyy-MM-dd'), endDate: end };
    case 'last90':
      return { startDate: format(subDays(today, 90), 'yyyy-MM-dd'), endDate: end };
    case 'currentMonth':
      return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: end };
    default:
      return { startDate: format(subDays(today, 30), 'yyyy-MM-dd'), endDate: end };
  }
}
