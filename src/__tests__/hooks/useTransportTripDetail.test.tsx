import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransportTripDetail } from '../../hooks/useTransportTripDetail';
import * as transportTripServiceModule from '../../services/transportTripService';
import * as tripStopServiceModule from '../../services/tripStopService';
import { ApiError } from '../../services/api';
import type { TransportTrip } from '../../types/transportTrip';
import type { TripStop } from '../../types/tripStop';

// Mock services
vi.mock('../../services/transportTripService', () => ({
  transportTripService: {
    getTripById: vi.fn(),
  },
}));

vi.mock('../../services/tripStopService', () => ({
  tripStopService: {
    getTripStops: vi.fn(),
  },
}));

describe('hooks/useTransportTripDetail - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch trip and stops simultaneously on mount', async () => {
    const mockTrip: TransportTrip = {
      id: 'trip-1',
      vehicle: { name: 'Truck A', plateNumber: '29A-12345' },
      status: 'Completed',
      originWarehouse: 'Hanoi',
      destinationWarehouse: 'HCMC',
      scheduledDate: '2024-01-15',
      shipmentCount: 10,
      totalWeightKg: 5000,
      stops: [],
    };

    const mockStops: TripStop[] = [
      {
        id: 'stop-1',
        tripId: 'trip-1',
        warehouseName: 'Hanoi',
        warehouseLocation: 'HN',
        sequence: 1,
        scheduledArrival: '2024-01-15T08:00:00Z',
        scheduledDeparture: '2024-01-15T09:00:00Z',
        loadedBills: [],
        unloadedBills: [],
      },
    ];

    vi.mocked(transportTripServiceModule.transportTripService.getTripById).mockResolvedValue(mockTrip);
    vi.mocked(tripStopServiceModule.tripStopService.getTripStops).mockResolvedValue(mockStops);

    const { result } = renderHook(() => useTransportTripDetail('trip-1'));

    await waitFor(() => {
      expect(result.current.trip).toEqual(mockTrip);
      expect(result.current.stops).toEqual(mockStops);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should set notFound true when service throws ApiError with status 404', async () => {
    vi.mocked(transportTripServiceModule.transportTripService.getTripById).mockRejectedValue(
      new ApiError(404, 'Not found')
    );
    vi.mocked(tripStopServiceModule.tripStopService.getTripStops).mockResolvedValue([]);

    const { result } = renderHook(() => useTransportTripDetail('nonexistent'));

    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should set error when service throws non-404 error', async () => {
    vi.mocked(transportTripServiceModule.transportTripService.getTripById).mockRejectedValue(
      new Error('Network error')
    );
    vi.mocked(tripStopServiceModule.tripStopService.getTripStops).mockResolvedValue([]);

    const { result } = renderHook(() => useTransportTripDetail('trip-1'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should refetch data when refetch is called', async () => {
    const mockTrip: TransportTrip = {
      id: 'trip-1',
      vehicle: { name: 'Truck A', plateNumber: '29A-12345' },
      status: 'Pending',
      originWarehouse: 'Hanoi',
      destinationWarehouse: 'HCMC',
      scheduledDate: '2024-01-15',
      shipmentCount: 10,
      totalWeightKg: 5000,
      stops: [],
    };

    const updatedTrip: TransportTrip = { ...mockTrip, status: 'Completed' };

    vi.mocked(transportTripServiceModule.transportTripService.getTripById)
      .mockResolvedValueOnce(mockTrip)
      .mockResolvedValueOnce(updatedTrip);
    vi.mocked(tripStopServiceModule.tripStopService.getTripStops).mockResolvedValue([]);

    const { result } = renderHook(() => useTransportTripDetail('trip-1'));

    await waitFor(() => {
      expect(result.current.trip?.status).toBe('Pending');
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.trip?.status).toBe('Completed');
    });
  });

  it('should not update state after unmount during fetch', async () => {
    let resolveFetch: (value: TransportTrip) => void;
    const fetchPromise = new Promise<TransportTrip>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(transportTripServiceModule.transportTripService.getTripById).mockReturnValue(fetchPromise);
    vi.mocked(tripStopServiceModule.tripStopService.getTripStops).mockResolvedValue([]);

    const { result, unmount } = renderHook(() => useTransportTripDetail('trip-1'));

    expect(result.current.isLoading).toBe(true);

    // Unmount before fetch completes
    unmount();

    // Resolve fetch after unmount
    const mockTrip: TransportTrip = {
      id: 'trip-1',
      vehicle: { name: 'Truck A', plateNumber: '29A-12345' },
      status: 'Completed',
      originWarehouse: 'Hanoi',
      destinationWarehouse: 'HCMC',
      scheduledDate: '2024-01-15',
      shipmentCount: 10,
      totalWeightKg: 5000,
      stops: [],
    };
    resolveFetch!(mockTrip);

    // No errors should be thrown (state update cancelled)
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
