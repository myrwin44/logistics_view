/**
 * Property-Based Test: Date Format Rendering Consistency
 *
 * Feature: lgts-platform, Property 7: Date format rendering consistency
 * Arbitrary: fc.date() for the date value,
 *            fc.constantFrom('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY') for format
 * For any date + format → formatDate output matches the format pattern
 *                         and parses back to same calendar day
 *
 * Validates: Requirements 11.4
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { DateFormat } from '../../types/settings';
import { formatDate } from '../../lib/dateFormat';

/** Regex patterns for each DateFormat option. */
const FORMAT_PATTERNS: Record<DateFormat, RegExp> = {
  'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
  'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
  'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
};

/**
 * Parse a formatted string back to { year, month, day } according to the
 * format that produced it, so we can compare against the original Date.
 */
function parseFormatted(
  str: string,
  fmt: DateFormat,
): { year: number; month: number; day: number } {
  switch (fmt) {
    case 'YYYY-MM-DD': {
      const [y, m, d] = str.split('-').map(Number);
      return { year: y, month: m, day: d };
    }
    case 'MM/DD/YYYY': {
      const [m, d, y] = str.split('/').map(Number);
      return { year: y, month: m, day: d };
    }
    case 'DD/MM/YYYY': {
      const [d, m, y] = str.split('/').map(Number);
      return { year: y, month: m, day: d };
    }
  }
}

/**
 * Constrain generated dates to a range where the local-time calendar date
 * always has a 4-digit year (1000–9999). date-fns format() uses local time,
 * so UTC dates near year boundaries can shift by up to ±14 hours. We pad
 * the min/max by 2 days to absorb any timezone offset worldwide.
 */
const REALISTIC_DATE = fc.date({
  min: new Date('1000-01-03T00:00:00.000Z'),
  max: new Date('9999-12-29T23:59:59.999Z'),
});

describe('Property 7 — Date Format Rendering Consistency', () => {
  it('formatDate output matches structural pattern for the given format', () => {
    fc.assert(
      fc.property(
        REALISTIC_DATE,
        fc.constantFrom<DateFormat>('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'),
        (date, fmt) => {
          const result = formatDate(date, fmt);
          return FORMAT_PATTERNS[fmt].test(result);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('formatDate output parses back to the same calendar day', () => {
    fc.assert(
      fc.property(
        REALISTIC_DATE,
        fc.constantFrom<DateFormat>('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'),
        (date, fmt) => {
          const result = formatDate(date, fmt);
          const { year, month, day } = parseFormatted(result, fmt);

          // Compare against the original Date's local calendar day
          return (
            year === date.getFullYear() &&
            month === date.getMonth() + 1 && // Date.getMonth() is 0-indexed
            day === date.getDate()
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
