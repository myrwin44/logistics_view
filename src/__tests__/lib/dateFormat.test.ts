import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDate, resolveDefaultDateRange } from '../../lib/dateFormat';
import type { DateFormat } from '../../types/settings';
import { format, subDays, startOfMonth } from 'date-fns';

describe('lib/dateFormat.ts - Unit Tests', () => {
  describe('formatDate', () => {
    it('should format Date object with YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T00:00:00.000Z');
      const result = formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-03-15');
    });

    it('should format Date object with MM/DD/YYYY', () => {
      const date = new Date('2024-03-15T00:00:00.000Z');
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('03/15/2024');
    });

    it('should format Date object with DD/MM/YYYY', () => {
      const date = new Date('2024-03-15T00:00:00.000Z');
      const result = formatDate(date, 'DD/MM/YYYY');
      expect(result).toBe('15/03/2024');
    });

    it('should parse API datetime string with space separator', () => {
      const apiDate = '2026-04-30 03:32:25';
      const result = formatDate(apiDate, 'YYYY-MM-DD');
      expect(result).toMatch(/2026-04-30/);
    });
  });

  describe('resolveDefaultDateRange', () => {
    it('should resolve "last7" to 7 days ago', () => {
      const today = new Date();
      const result = resolveDefaultDateRange('last7');
      const expectedStart = format(subDays(today, 7), 'yyyy-MM-dd');
      const expectedEnd = format(today, 'yyyy-MM-dd');
      expect(result.startDate).toBe(expectedStart);
      expect(result.endDate).toBe(expectedEnd);
    });

    it('should resolve "last30" to 30 days ago', () => {
      const today = new Date();
      const result = resolveDefaultDateRange('last30');
      const expectedStart = format(subDays(today, 30), 'yyyy-MM-dd');
      const expectedEnd = format(today, 'yyyy-MM-dd');
      expect(result.startDate).toBe(expectedStart);
      expect(result.endDate).toBe(expectedEnd);
    });

    it('should resolve "last90" to 90 days ago', () => {
      const today = new Date();
      const result = resolveDefaultDateRange('last90');
      const expectedStart = format(subDays(today, 90), 'yyyy-MM-dd');
      const expectedEnd = format(today, 'yyyy-MM-dd');
      expect(result.startDate).toBe(expectedStart);
      expect(result.endDate).toBe(expectedEnd);
    });

    it('should resolve "currentMonth" to start of current month', () => {
      const today = new Date();
      const result = resolveDefaultDateRange('currentMonth');
      const expectedStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const expectedEnd = format(today, 'yyyy-MM-dd');
      expect(result.startDate).toBe(expectedStart);
      expect(result.endDate).toBe(expectedEnd);
    });
  });

  describe('formatDate - Property-Based Tests', () => {
    it('should return non-empty string for all DateFormat values', () => {
      const formats: DateFormat[] = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
      fc.assert(
        fc.property(fc.date(), fc.constantFrom(...formats), (date, fmt) => {
          const result = formatDate(date, fmt);
          expect(result.length).toBeGreaterThan(0);
        })
      );
    });
  });
});
