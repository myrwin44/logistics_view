import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUIStore } from '../../store/uiStore';
import { resolveDefaultDateRange } from '../../lib/dateFormat';

describe('store/uiStore - Integration Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Reset store to fresh default (recompute last30 dates)
    const defaultRange = resolveDefaultDateRange('last30');
    useUIStore.setState({
      globalDateRange: defaultRange,
      setGlobalDateRange: useUIStore.getState().setGlobalDateRange,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should initialize globalDateRange with last30 default', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.globalDateRange.startDate).toBeTruthy();
    expect(result.current.globalDateRange.endDate).toBeTruthy();
    // endDate should be today in ISO format
    const today = new Date().toISOString().slice(0, 10);
    expect(result.current.globalDateRange.endDate).toBe(today);
  });

  it('should update globalDateRange in store when setGlobalDateRange is called', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setGlobalDateRange({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    expect(result.current.globalDateRange).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
  });

  it('should persist globalDateRange to sessionStorage', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setGlobalDateRange({
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      });
    });

    const stored = sessionStorage.getItem('lgts_global_date_range');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.globalDateRange).toEqual({
      startDate: '2024-06-01',
      endDate: '2024-06-30',
    });
  });
});
