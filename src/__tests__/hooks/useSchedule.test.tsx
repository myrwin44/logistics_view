import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSchedule } from '../../hooks/useSchedule';
import * as scheduleServiceModule from '../../services/scheduleService';
import type { ScheduleRun } from '../../types/schedule';

// Mock scheduleService
vi.mock('../../services/scheduleService', () => ({
  scheduleService: {
    generateSchedule: vi.fn(),
    getScheduleRun: vi.fn(),
  },
}));

// Helper to build a minimal valid ScheduleRun
function makeRun(status: ScheduleRun['status']): ScheduleRun {
  return {
    id: 'run-1',
    status,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    generatedTrips: [],
  };
}

describe('hooks/useSchedule - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state with null scheduleRun, false isLoading, null error', () => {
    const { result } = renderHook(() => useSchedule());

    expect(result.current.scheduleRun).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set isLoading true when generate returns Pending run', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockResolvedValue(
      makeRun('Pending')
    );
    // Poll never resolves during this test — we just check isLoading state
    vi.mocked(scheduleServiceModule.scheduleService.getScheduleRun).mockResolvedValue(
      makeRun('Pending')
    );

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.scheduleRun?.status).toBe('Pending');
  });

  it('should set isLoading false and update scheduleRun when Completed is polled', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockResolvedValue(
      makeRun('Pending')
    );
    vi.mocked(scheduleServiceModule.scheduleService.getScheduleRun).mockResolvedValue(
      makeRun('Completed')
    );

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    // Wait for the polling interval (2000ms) to fire and resolve
    await waitFor(
      () => {
        expect(result.current.scheduleRun?.status).toBe('Completed');
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );
  });

  it('should set isLoading false when Failed is polled', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockResolvedValue(
      makeRun('Pending')
    );
    vi.mocked(scheduleServiceModule.scheduleService.getScheduleRun).mockResolvedValue(
      makeRun('Failed')
    );

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    await waitFor(
      () => {
        expect(result.current.scheduleRun?.status).toBe('Failed');
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );
  });

  it('should set error and isLoading false when generate throws', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear all state when reset is called', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockResolvedValue(
      makeRun('Completed')
    );

    const { result } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    expect(result.current.scheduleRun).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.scheduleRun).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should stop polling on unmount without throwing errors', async () => {
    vi.mocked(scheduleServiceModule.scheduleService.generateSchedule).mockResolvedValue(
      makeRun('Pending')
    );
    // getScheduleRun never resolves during this test
    vi.mocked(scheduleServiceModule.scheduleService.getScheduleRun).mockReturnValue(
      new Promise(() => {})
    );

    const { result, unmount } = renderHook(() => useSchedule());

    await act(async () => {
      await result.current.generate({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    expect(result.current.isLoading).toBe(true);

    // Unmount should stop interval cleanly
    unmount();
    // No errors thrown
  });
});
