import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { useUrlParams } from '../../hooks/useUrlParams';
import type { UrlParamsConfig } from '../../hooks/useUrlParams';

// Simple test filter type
interface TestFilters extends Record<string, unknown> {
  status: string | undefined;
}

const testConfig: UrlParamsConfig<TestFilters> = {
  parseFilters(params) {
    return { status: params.get('status') || undefined };
  },
  serializeFilters(params, partial) {
    if ('status' in partial) {
      if (partial.status) {
        params.set('status', partial.status);
      } else {
        params.delete('status');
      }
    }
    return params;
  },
  parseSortField: (raw) => raw || undefined,
  parseSortDir(raw) {
    if (raw === 'asc' || raw === 'desc') return raw;
    return undefined;
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeWrapper(initialPath = '/') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>;
  };
}

describe('hooks/useUrlParams - Integration Tests', () => {
  it('should parse page param from URL as integer', () => {
    const { result } = renderHook(() => useUrlParams(testConfig), {
      wrapper: makeWrapper('/?page=3'),
    });

    expect(result.current.page).toBe(3);
  });

  it('should default page to 0 when not in URL', () => {
    const { result } = renderHook(() => useUrlParams(testConfig), {
      wrapper: makeWrapper('/'),
    });

    expect(result.current.page).toBe(0);
  });

  it('should update URL page param when setPage is called', () => {
    const { result } = renderHook(
      () => {
        const params = useUrlParams(testConfig);
        const [searchParams] = useSearchParams();
        return { params, searchParams };
      },
      { wrapper: makeWrapper('/') }
    );

    act(() => {
      result.current.params.setPage(5);
    });

    expect(result.current.searchParams.get('page')).toBe('5');
  });

  it('should update sort/dir params and reset page to 0 when setSort called', () => {
    const { result } = renderHook(
      () => {
        const params = useUrlParams(testConfig);
        const [searchParams] = useSearchParams();
        return { params, searchParams };
      },
      { wrapper: makeWrapper('/?page=3') }
    );

    act(() => {
      result.current.params.setSort('name', 'asc');
    });

    expect(result.current.searchParams.get('sort')).toBe('name');
    expect(result.current.searchParams.get('dir')).toBe('asc');
    expect(result.current.searchParams.get('page')).toBe('0');
  });

  it('should call serializeFilters and reset page to 0 when setFilters called', () => {
    const { result } = renderHook(
      () => {
        const params = useUrlParams(testConfig);
        const [searchParams] = useSearchParams();
        return { params, searchParams };
      },
      { wrapper: makeWrapper('/?page=5') }
    );

    act(() => {
      result.current.params.setFilters({ status: 'active' });
    });

    expect(result.current.searchParams.get('status')).toBe('active');
    expect(result.current.searchParams.get('page')).toBe('0');
  });

  it('should remove sort param from URL when setSort called with undefined field', () => {
    const { result } = renderHook(
      () => {
        const params = useUrlParams(testConfig);
        const [searchParams] = useSearchParams();
        return { params, searchParams };
      },
      { wrapper: makeWrapper('/?sort=name&dir=asc') }
    );

    act(() => {
      result.current.params.setSort(undefined, undefined);
    });

    expect(result.current.searchParams.get('sort')).toBeNull();
    expect(result.current.searchParams.get('dir')).toBeNull();
  });
});
