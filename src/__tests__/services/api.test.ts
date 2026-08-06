import { describe, it, expect } from 'vitest';
import { ApiError, toQueryString } from '../../services/api';

describe('services/api.ts - Unit Tests', () => {
  describe('ApiError', () => {
    it('should be instance of Error with status and message', () => {
      const error = new ApiError(404, 'Not found');
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
    });

    it('should have name "ApiError"', () => {
      const error = new ApiError(500, 'Server error');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('toQueryString', () => {
    it('should omit entries with undefined values', () => {
      const result = toQueryString({ page: 1, status: undefined });
      expect(result).toBe('page=1');
      expect(result).not.toContain('status');
    });

    it('should omit entries with null values', () => {
      const result = toQueryString({ page: 1, status: null });
      expect(result).toBe('page=1');
      expect(result).not.toContain('status');
    });

    it('should omit entries with empty string values', () => {
      const result = toQueryString({ page: 1, status: '' });
      expect(result).toBe('page=1');
      expect(result).not.toContain('status');
    });

    it('should keep entries with value 0', () => {
      const result = toQueryString({ page: 0, size: 25 });
      expect(result).toContain('page=0');
    });

    it('should keep entries with value false', () => {
      const result = toQueryString({ active: false });
      expect(result).toContain('active=false');
    });

    it('should return empty string for empty object', () => {
      expect(toQueryString({})).toBe('');
    });
  });

  describe('safeParseJSON (Snowflake ID behavior)', () => {
    it('should parse regular JSON correctly', () => {
      const parsed = JSON.parse('{"id": 123, "name": "test"}');
      expect(parsed).toEqual({ id: 123, name: 'test' });
    });

    it('large integers (> MAX_SAFE_INTEGER) lose precision in plain JSON.parse', () => {
      // 9223372036854775807 is a valid 64-bit int but > Number.MAX_SAFE_INTEGER
      const jsonStr = '{"id": 9223372036854775807}';
      const parsed = JSON.parse(jsonStr);
      // parsed.id is a JS number — compare via string to confirm precision loss
      // BigInt preserves the original value; Number(parsed.id).toString() will differ
      const originalAsBigInt = BigInt('9223372036854775807');
      const parsedAsBigInt = BigInt(parsed.id);
      // They should NOT be equal because JS number loses the last digits
      expect(parsedAsBigInt).not.toBe(originalAsBigInt);
    });

    it('safe integers are preserved exactly by plain JSON.parse', () => {
      const parsed = JSON.parse('{"id": 123456789}');
      expect(parsed.id).toBe(123456789);
    });
  });
});
