/**
 * useBillDetail hook — fetches a single shipment bill including its journey track logs.
 * Powered by TanStack Query for caching and deduplication.
 */

import { useQuery } from '@tanstack/react-query';
import { billOfLadingService } from '../services/billOfLadingService';
import { ApiError } from '../services/api';
import type { ShipmentBillDetail } from '../types/billOfLading';

export interface UseBillDetailResult {
  bill: ShipmentBillDetail | null;
  isLoading: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBillDetail(billId: string): UseBillDetailResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bill-detail', billId],
    queryFn: () => billOfLadingService.getBillById(billId),
    enabled: !!billId,
  });

  const notFound = error instanceof ApiError && error.status === 404;

  return {
    bill: data ?? null,
    isLoading,
    notFound,
    error: error as Error | null,
    refetch,
  };
}
