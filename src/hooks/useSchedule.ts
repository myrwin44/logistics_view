/**
 * useSchedule hook — triggers external model schedule generation and polls for run completion.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { scheduleService } from '../services/scheduleService';
import type { ScheduleRun, ScheduleRequest } from '../types/schedule';

export interface UseScheduleResult {
  scheduleRun: ScheduleRun | null;
  isLoading: boolean;
  error: Error | null;
  generate: (request: ScheduleRequest) => void;
  reset: () => void;
}

const POLL_INTERVAL_MS = 2000;

export function useSchedule(): UseScheduleResult {
  const [scheduleRun, setScheduleRun] = useState<ScheduleRun | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Stores the run ID to poll; null means no active poll
  const [runId, setRunId] = useState<string | null>(null);

  // Keep a ref to the interval so we can clear it from multiple places
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Poll whenever runId is set; clean up on unmount or when runId clears
  useEffect(() => {
    if (!runId) return;

    const poll = async () => {
      try {
        const run = await scheduleService.getScheduleRun(runId);
        setScheduleRun(run);

        if (run.status === 'Completed' || run.status === 'Failed') {
          stopPolling();
          setRunId(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        stopPolling();
        setRunId(null);
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [runId, stopPolling]);

  const generate = useCallback(async (request: ScheduleRequest) => {
    // Stop any in-flight poll before starting a new generation
    stopPolling();
    setRunId(null);
    setScheduleRun(null);
    setError(null);
    setIsLoading(true);

    try {
      const run = await scheduleService.generateSchedule(request);
      setScheduleRun(run);

      if (run.status === 'Pending') {
        // Start polling
        setRunId(run.id);
      } else {
        // Already Completed or Failed — no polling needed
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setRunId(null);
    setScheduleRun(null);
    setIsLoading(false);
    setError(null);
  }, [stopPolling]);

  return { scheduleRun, isLoading, error, generate, reset };
}
