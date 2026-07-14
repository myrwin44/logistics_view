/**
 * useTransportTripDetail hook — fetches a single transport trip and its stops.
 */

import { useState, useEffect, useCallback } from 'react';
import { transportTripService } from '../services/transportTripService';
import { tripStopService } from '../services/tripStopService';
import { ApiError } from '../services/api';
import type { TransportTrip } from '../types/transportTrip';
import type { TripStop } from '../types/tripStop';

export interface UseTransportTripDetailResult {
  trip: TransportTrip | null;
  stops: TripStop[];
  isLoading: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTransportTripDetail(tripId: string): UseTransportTripDetailResult {
  const [trip, setTrip] = useState<TransportTrip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Increment to trigger re-fetch without changing tripId
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([
      transportTripService.getTripById(tripId),
      tripStopService.getTripStops(tripId),
    ])
      .then(([tripData, stopsData]) => {
        if (!cancelled) {
          setTrip(tripData);
          setStops(stopsData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // fetchCount triggers re-fetch when refetch() is called
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, fetchCount]);

  return { trip, stops, isLoading, notFound, error, refetch };
}
