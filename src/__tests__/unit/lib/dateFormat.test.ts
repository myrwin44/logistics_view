/**
 * Unit tests for src/lib/dateFormat.ts
 *
 * Covers:
 * - formatDate with each of the three DateFormat options
 * - formatDate edge cases: month boundaries, leap year Feb 29
 * - resolveDefaultDateRange for all four DefaultDateRange values
 * - resolveDefaultDateRange: endDate is today, startDate is correct relative to today
 *
 * Requirements: 11.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { format, subDays, startOfMonth } from 'date-fns';
import { formatDate, resolveDefaultDateRange } from '../../../lib/dateFormat';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  describe("format 'YYYY-MM-DD'", () => {
    it('formats a regular date', () => {
      expect(formatDate(new Date(2024, 5, 15), 'YYYY-MM-DD')).toBe('2024-06-15');
    });

    it('pads month and day with leading zeros', () => {
      expect(formatDate(new Date(2024, 0, 7), 'YYYY-MM-DD')).toBe('2024-01-07');
    });

    it('formats from an ISO string', () => {
      expect(formatDate('2023-11-20', 'YYYY-MM-DD')).toBe('2023-11-20');
    });

    it('formats a month-boundary date (Dec 31)', () => {
      expect(formatDate(new Date(2023, 11, 31), 'YYYY-MM-DD')).toBe('2023-12-31');
    });

    it('formats a month-boundary date (Jan 1)', () => {
      expect(formatDate(new Date(2024, 0, 1), 'YYYY-MM-DD')).toBe('2024-01-01');
    });

    it('formats leap year Feb 29', () => {
      expect(formatDate(new Date(2024, 1, 29), 'YYYY-MM-DD')).toBe('2024-02-29');
    });
  });

  describe("format 'MM/DD/YYYY'", () => {
    it('formats a regular date', () => {
      expect(formatDate(new Date(2024, 5, 15), 'MM/DD/YYYY')).toBe('06/15/2024');
    });

    it('pads month and day with leading zeros', () => {
      expect(formatDate(new Date(2024, 0, 7), 'MM/DD/YYYY')).toBe('01/07/2024');
    });

    it('formats from an ISO string', () => {
      expect(formatDate('2023-11-20', 'MM/DD/YYYY')).toBe('11/20/2023');
    });

    it('formats a month-boundary date (Dec 31)', () => {
      expect(formatDate(new Date(2023, 11, 31), 'MM/DD/YYYY')).toBe('12/31/2023');
    });

    it('formats a month-boundary date (Jan 1)', () => {
      expect(formatDate(new Date(2024, 0, 1), 'MM/DD/YYYY')).toBe('01/01/2024');
    });

    it('formats leap year Feb 29', () => {
      expect(formatDate(new Date(2024, 1, 29), 'MM/DD/YYYY')).toBe('02/29/2024');
    });
  });

  describe("format 'DD/MM/YYYY'", () => {
    it('formats a regular date', () => {
      expect(formatDate(new Date(2024, 5, 15), 'DD/MM/YYYY')).toBe('15/06/2024');
    });

    it('pads day and month with leading zeros', () => {
      expect(formatDate(new Date(2024, 0, 7), 'DD/MM/YYYY')).toBe('07/01/2024');
    });

    it('formats from an ISO string', () => {
      expect(formatDate('2023-11-20', 'DD/MM/YYYY')).toBe('20/11/2023');
    });

    it('formats a month-boundary date (Dec 31)', () => {
      expect(formatDate(new Date(2023, 11, 31), 'DD/MM/YYYY')).toBe('31/12/2023');
    });

    it('formats a month-boundary date (Jan 1)', () => {
      expect(formatDate(new Date(2024, 0, 1), 'DD/MM/YYYY')).toBe('01/01/2024');
    });

    it('formats leap year Feb 29', () => {
      expect(formatDate(new Date(2024, 1, 29), 'DD/MM/YYYY')).toBe('29/02/2024');
    });
  });
});

// ---------------------------------------------------------------------------
// resolveDefaultDateRange
// ---------------------------------------------------------------------------

describe('resolveDefaultDateRange', () => {
  // Pin "today" so tests are deterministic regardless of when they run
  const FIXED_NOW = new Date(2024, 5, 15); // 2024-06-15

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const todayStr = format(FIXED_NOW, 'yyyy-MM-dd'); // '2024-06-15'

  it("'last7' — endDate is today", () => {
    expect(resolveDefaultDateRange('last7').endDate).toBe(todayStr);
  });

  it("'last7' — startDate is 7 days before today", () => {
    const expected = format(subDays(FIXED_NOW, 7), 'yyyy-MM-dd'); // '2024-06-08'
    expect(resolveDefaultDateRange('last7').startDate).toBe(expected);
  });

  it("'last30' — endDate is today", () => {
    expect(resolveDefaultDateRange('last30').endDate).toBe(todayStr);
  });

  it("'last30' — startDate is 30 days before today", () => {
    const expected = format(subDays(FIXED_NOW, 30), 'yyyy-MM-dd'); // '2024-05-16'
    expect(resolveDefaultDateRange('last30').startDate).toBe(expected);
  });

  it("'last90' — endDate is today", () => {
    expect(resolveDefaultDateRange('last90').endDate).toBe(todayStr);
  });

  it("'last90' — startDate is 90 days before today", () => {
    const expected = format(subDays(FIXED_NOW, 90), 'yyyy-MM-dd'); // '2024-03-17'
    expect(resolveDefaultDateRange('last90').startDate).toBe(expected);
  });

  it("'currentMonth' — endDate is today", () => {
    expect(resolveDefaultDateRange('currentMonth').endDate).toBe(todayStr);
  });

  it("'currentMonth' — startDate is the first day of the current month", () => {
    const expected = format(startOfMonth(FIXED_NOW), 'yyyy-MM-dd'); // '2024-06-01'
    expect(resolveDefaultDateRange('currentMonth').startDate).toBe(expected);
  });

  it('all results use ISO YYYY-MM-DD format', () => {
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const pref of ['last7', 'last30', 'last90', 'currentMonth'] as const) {
      const { startDate, endDate } = resolveDefaultDateRange(pref);
      expect(startDate).toMatch(isoPattern);
      expect(endDate).toMatch(isoPattern);
    }
  });

  it('startDate is always before or equal to endDate', () => {
    for (const pref of ['last7', 'last30', 'last90', 'currentMonth'] as const) {
      const { startDate, endDate } = resolveDefaultDateRange(pref);
      expect(startDate <= endDate).toBe(true);
    }
  });

  it("'currentMonth' on the 1st of the month — startDate equals endDate", () => {
    const firstOfMonth = new Date(2024, 6, 1); // 2024-07-01
    vi.setSystemTime(firstOfMonth);
    const { startDate, endDate } = resolveDefaultDateRange('currentMonth');
    expect(startDate).toBe('2024-07-01');
    expect(endDate).toBe('2024-07-01');
  });
});
