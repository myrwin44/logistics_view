import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatDateTimeShort,
  formatDateTimeFull,
  formatMinutes,
  stripWarehousePrefix,
  formatWeight,
  formatWeightCompact,
} from '../../lib/format';

describe('lib/format.ts - Unit Tests', () => {
  describe('formatDateTimeShort', () => {
    it('should format valid ISO string as DD/MM HH:mm', () => {
      // Use a fixed UTC date to avoid timezone issues in test
      const result = formatDateTimeShort('2024-03-15T00:00:00.000Z');
      expect(result).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it('should return original string for invalid date', () => {
      const invalid = 'not-a-date';
      expect(formatDateTimeShort(invalid)).toBe(invalid);
    });
  });

  describe('formatDateTimeFull', () => {
    it('should format valid ISO string as DD/MM/YYYY HH:mm', () => {
      const result = formatDateTimeFull('2024-03-15T00:00:00.000Z');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should return original string for invalid date', () => {
      const invalid = 'invalid-date';
      expect(formatDateTimeFull(invalid)).toBe(invalid);
    });
  });

  describe('formatMinutes', () => {
    it('should return "0 ph" for zero minutes', () => {
      expect(formatMinutes(0)).toBe('0 ph');
    });

    it('should return hour-only format for exact hour multiples (non-zero)', () => {
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(180)).toBe('3h');
    });

    it('should return "Nh Mph" format for non-exact hours', () => {
      expect(formatMinutes(90)).toBe('1h 30ph');
      expect(formatMinutes(150)).toBe('2h 30ph');
      expect(formatMinutes(61)).toBe('1h 1ph');
    });

    it('should handle minutes less than 60', () => {
      expect(formatMinutes(45)).toBe('45 ph');
      expect(formatMinutes(1)).toBe('1 ph');
    });
  });

  describe('stripWarehousePrefix', () => {
    it('should remove "Kho " prefix case-insensitively', () => {
      expect(stripWarehousePrefix('Kho Hà Nội')).toBe('Hà Nội');
      expect(stripWarehousePrefix('kho An Giang')).toBe('An Giang');
      expect(stripWarehousePrefix('KHO Đà Nẵng')).toBe('Đà Nẵng');
    });

    it('should return unchanged string without "Kho " prefix', () => {
      expect(stripWarehousePrefix('Hanoi')).toBe('Hanoi');
      expect(stripWarehousePrefix('Central Warehouse')).toBe('Central Warehouse');
    });
  });

  describe('formatWeight', () => {
    it('should format < 1000 kg with "kg" suffix', () => {
      // vi-VN: no thousands separator for < 1000
      expect(formatWeight(500)).toBe('500 kg');
      expect(formatWeight(850)).toBe('850 kg');
    });

    it('should format >= 1000 kg as "X,XX tấn" (vi-VN locale: comma as decimal sep)', () => {
      // vi-VN uses comma for decimal separator
      expect(formatWeight(1000)).toBe('1,00 tấn');
      expect(formatWeight(1250)).toBe('1,25 tấn');
      // 4482790 / 1000 = 4482.79 → vi-VN: "4.482,79 tấn"
      expect(formatWeight(4482790)).toBe('4.482,79 tấn');
    });

    it('should return "—" for null, undefined, or NaN', () => {
      expect(formatWeight(null as unknown as number)).toBe('—');
      expect(formatWeight(undefined as unknown as number)).toBe('—');
      expect(formatWeight(NaN)).toBe('—');
    });
  });

  describe('formatWeightCompact', () => {
    it('should use absolute value for negative numbers', () => {
      expect(formatWeightCompact(-500)).toBe('500 kg');
      expect(formatWeightCompact(-1500)).toBe('1 tấn');
    });

    it('should format >= 1000 kg as integer ton with no decimals', () => {
      expect(formatWeightCompact(1000)).toBe('1 tấn');
      expect(formatWeightCompact(1999)).toBe('1 tấn');
      expect(formatWeightCompact(2500)).toBe('2 tấn');
    });

    it('should return "—" for invalid values', () => {
      expect(formatWeightCompact(null as unknown as number)).toBe('—');
      expect(formatWeightCompact(NaN)).toBe('—');
    });
  });
});

describe('lib/format.ts - Property-Based Tests', () => {
  it('formatDateTimeShort returns DD/MM HH:mm pattern for all valid dates (year < 9999)', () => {
    fc.assert(
      fc.property(
        // Limit to year < 9999 to avoid 5-digit year edge case
        fc.date({ min: new Date('1970-01-01'), max: new Date('9998-12-31') }),
        (date) => {
          const iso = date.toISOString();
          const result = formatDateTimeShort(iso);
          expect(result).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
        }
      )
    );
  });

  it('formatDateTimeFull returns DD/MM/YYYY HH:mm pattern for all valid dates (year < 9999)', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1970-01-01'), max: new Date('9998-12-31') }),
        (date) => {
          const iso = date.toISOString();
          const result = formatDateTimeFull(iso);
          expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
        }
      )
    );
  });

  it('formatMinutes(n*60) returns hour-only format (no "ph") for all n > 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
        const result = formatMinutes(n * 60);
        // When n > 0, result should be "Nh" with no "ph"
        expect(result).not.toContain('ph');
      })
    );
  });

  it('formatMinutes returns non-empty string for all valid minute counts', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999 }), (mins) => {
        const result = formatMinutes(mins);
        expect(result.length).toBeGreaterThan(0);
      })
    );
  });

  it('stripWarehousePrefix removes "Kho " prefix for all cases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Kho ', 'kho ', 'KHO ', 'KhO '),
        // Use ascii strings to avoid issues with arbitrary unicode + whitespace
        fc.stringOf(fc.char(), { minLength: 1, maxLength: 20 }),
        (prefix, suffix) => {
          // Strip any leading/trailing whitespace from suffix to ensure it's non-empty
          const cleanSuffix = suffix.trim() || 'X';
          const input = prefix + cleanSuffix;
          const result = stripWarehousePrefix(input);
          expect(result.toLowerCase()).not.toMatch(/^kho\s/);
        }
      )
    );
  });

  it('formatWeight returns string containing "kg" or "tấn" for all kg >= 0', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1_000_000, noNaN: true }), (kg) => {
        const result = formatWeight(kg);
        expect(result).toMatch(/kg|tấn/);
      })
    );
  });

  it('formatWeightCompact returns string containing "kg", "tấn", or "—"', () => {
    fc.assert(
      fc.property(fc.float({ min: -100_000, max: 100_000, noNaN: true }), (kg) => {
        const result = formatWeightCompact(kg);
        expect(result).toMatch(/kg|tấn|—/);
      })
    );
  });

  it('formatWeightCompact(kg) === formatWeightCompact(-kg) (symmetry)', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 100_000, noNaN: true }), (kg) => {
        expect(formatWeightCompact(kg)).toBe(formatWeightCompact(-kg));
      })
    );
  });
});
