/**
 * Trip stop service module.
 */

import { apiClient } from './api';
import type { TripStop } from '../types/tripStop';

export const tripStopService = {
  /** Fetch all stops for a given transport trip. */
  getTripStops: (tripId: string) =>
    apiClient.get<TripStop[]>(`/transport-trips/${tripId}/stops`),
};
