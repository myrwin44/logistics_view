/**
 * Transport trip service module.
 */

import { apiClient, toQueryString } from './api';
import type {
  TripQueryParams,
  TripListItem,
  TransportTrip,
  TripOverview,
  TripOverviewQueryParams,
  TripDetail,
  BillLeg,
} from '../types/transportTrip';
import type { PaginatedResponse, OffsetPaginatedResponse } from '../types/common';

/** Shape của backend response cho trip-detail endpoint. */
interface TripDetailResponse {
  success: boolean;
  message: string;
  data: TripDetail;
}

export const transportTripService = {
  /** Danh sách trips (paginated). */
  getTrips: (params: TripQueryParams) =>
    apiClient.get<PaginatedResponse<TripListItem>>(
      `/transport-trips?${toQueryString(params as unknown as Record<string, unknown>)}`
    ),

  /** Chi tiết trip theo ID chuỗi. */
  getTripById: (id: string) =>
    apiClient.get<TransportTrip>(`/transport-trips/${id}`),

  /**
   * Lấy TẤT CẢ TripOverview trong khoảng ngày (không phân trang phía client).
   * API trả về toàn bộ danh sách trong một lần gọi.
   */
  getTripOverviews: (params: TripOverviewQueryParams) =>
    apiClient.get<OffsetPaginatedResponse<TripOverview>>(
      `/transport-trips/trip-overviews?${toQueryString(params as unknown as Record<string, unknown>)}`
    ),

  /** Chi tiết đầy đủ một trip (overview + stop overviews). */
  getTripDetail: (tripId: string) =>
    apiClient.get<TripDetailResponse>(`/transport-trips/trip-detail/${tripId}`),

  /**
   * Danh sách bill legs của một trip — phân trang theo page (0-indexed).
   */
  getBillLegs: (tripId: string, page = 0) =>
    apiClient.get<OffsetPaginatedResponse<BillLeg>>(
      `/bill-legs/transport-trip/${tripId}?page=${page}`
    ),
};
