/**
 * useBillDetail hook — fetches a single shipment bill including its journey stops.
 */

import { useState, useEffect, useCallback } from 'react';
import { billOfLadingService } from '../services/billOfLadingService';
import { ApiError } from '../services/api';
import type { ShipmentBill } from '../types/billOfLading';

export interface UseBillDetailResult {
  bill: ShipmentBill | null;
  isLoading: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBillDetail(billId: string): UseBillDetailResult {
  const [bill, setBill] = useState<ShipmentBill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Increment to trigger re-fetch without changing billId
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!billId) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    billOfLadingService.getBillById(billId)
      .then((billData) => {
        if (!cancelled) {
          setBill(billData);
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
  }, [billId, fetchCount]);

  return { bill, isLoading, notFound, error, refetch };
}
