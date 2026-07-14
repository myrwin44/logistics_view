/**
 * Custom hook for fetching Gantt schedule data using TanStack Query.
 * Shared between ScheduleViewPage and SpatialSchedulePage.
 */

import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '../services/scheduleService';
import type { VehicleSchedule } from '../types/schedule';

export interface UseGanttScheduleParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface UseGanttScheduleResult {
  data: VehicleSchedule[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGanttSchedule({ startDate, endDate }: UseGanttScheduleParams): UseGanttScheduleResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gantt-schedule', startDate, endDate],
    queryFn: () =>
      scheduleService.getGanttSchedule({
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
      }),
    enabled: !!startDate && !!endDate,
    select: (res) => res.data ?? [],
  });

  return {
    data: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
