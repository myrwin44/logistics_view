/**
 * useDashboard hook — fetches aggregated dashboard data for a given date range.
 * TanStack Query for caching and deduplication.
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import type { DashboardData } from '../types/dashboard';

export interface UseDashboardParams {
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
}

export interface UseDashboardResult {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboard({ startDate, endDate }: UseDashboardParams): UseDashboardResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => dashboardService.getDashboardData(startDate, endDate),
    enabled: !!startDate && !!endDate, // skip fetch when either date is empty
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
