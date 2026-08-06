import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/cn';

describe('lib/cn.ts - Unit Tests', () => {
  it('should concatenate multiple class strings', () => {
    const result = cn('text-red-500', 'bg-blue-100', 'p-4');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-100');
    expect(result).toContain('p-4');
  });

  it('should keep only last conflicting Tailwind class', () => {
    const result = cn('p-4', 'p-8');
    expect(result).toContain('p-8');
    expect(result).not.toContain('p-4');
  });

  it('should ignore falsy values', () => {
    const result = cn('text-red-500', undefined, false, null, 'bg-blue-100');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-100');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('false');
    expect(result).not.toContain('null');
  });

  it('should return empty string with no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
