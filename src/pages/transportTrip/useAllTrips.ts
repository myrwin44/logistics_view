/**
 * useAllTrips — TanStack Query hook for trip overview data with client-side pagination.
 */
import { useQuery } from '@tanstack/react-query';
import { transportTripService } from '@/services/transportTripService';
import type { TripOverview } from '@/types/transportTrip';

export const OVERVIEW_PAGE_SIZE = 10;

export interface UseAllTripsParams {
  startDate: string;
  endDate: string;
  page: number;
}

export interface UseAllTripsResult {
  trips: TripOverview[];
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAllTrips(params: UseAllTripsParams): UseAllTripsResult {
  const { startDate, endDate, page } = params;
  const offset = (page - 1) * OVERVIEW_PAGE_SIZE;

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['trip-overviews', startDate, endDate, page],
    queryFn: () =>
      transportTripService.getTripOverviews({
        startDate: startDate ? `${startDate} 00:00:00` : '',
        endDate: endDate ? `${endDate} 23:59:59` : '',
      }),
    enabled: !!startDate && !!endDate,
    select: (res) => ({
      trips: res.data ?? [],
      totalElements: res.totalElements ?? 0,
      limit: res.limit ?? OVERVIEW_PAGE_SIZE,
    }),
  });

  // Client-side page slice from the full result
  const allTrips = data?.trips ?? [];
  const totalElements = data?.totalElements ?? 0;
  const limit = data?.limit ?? OVERVIEW_PAGE_SIZE;
  const pageTrips = allTrips.slice(offset, offset + limit);
  const totalPages = limit > 0 ? Math.ceil(totalElements / limit) : 1;

  return {
    trips: pageTrips,
    totalPages,
    isLoading: isFetching,
    error: error as Error | null,
    refetch,
  };
}
