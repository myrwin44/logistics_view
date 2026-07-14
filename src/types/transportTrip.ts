import type { TripStop } from './tripStop';
import type { SortDirection } from './common';

export type TripStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Vehicle {
  name: string;
  plateNumber: string;
}

export interface TripListItem {
  id: string;
  vehicle: Vehicle;
  status: TripStatus;
  originWarehouse: string;
  destinationWarehouse: string;
  scheduledDate: string;
  shipmentCount: number;
}

export interface TransportTrip extends TripListItem {
  totalWeightKg: number;
  stops: TripStop[];
}

export type TripSortField = 'id' | 'scheduledDate' | 'status' | 'vehicleName';
export type { SortDirection as SortDir } from './common';

export interface TripQueryParams {
  page: number;
  pageSize: number;
  sortField?: TripSortField;
  sortDir?: SortDirection;
  status?: TripStatus[];
  startDate?: string;
  endDate?: string;
}

/** Tổng quan một chuyến xe (dùng cho danh sách). */
export interface TripOverview {
  id: string;           // Snowflake ID
  licensePlate: string;
  noStops: number;
  originWarehouse: string;
  destinationWarehouse: string;
  totalBill: number;
  departure: string;    // ISO datetime
  arrival: string;      // ISO datetime
  totalLoad: number;    // kg
}

/** Thông tin tóm tắt của một điểm dừng trong chuyến. */
export interface TripStopOverview {
  seq_no: number;
  check_in: string;     // ISO datetime
  check_out: string;    // ISO datetime
  totalTime: number;    // phút
  uploadWeight: number;
  downloadWeight: number;
  distance: number;     // km đến điểm kế
}

/** Chi tiết đầy đủ một chuyến (overview + danh sách điểm dừng). */
export interface TripDetail {
  tripOverview: TripOverview;
  tripStopOverviews: TripStopOverview[];
}

/** Một bill leg trong chuyến xe. */
export interface BillLeg {
  billId: string;        // Snowflake ID — dùng string
  originWarehouse: string;
  destinationWarehouse: string;
  actualWeight: number;
  uploadAt: string;      // ISO datetime
  downloadAt: string;    // ISO datetime
}

/** Query params cho API trip-overviews. */
export interface TripOverviewQueryParams {
  startDate: string;    // "yyyy-MM-dd HH:mm:ss"
  endDate: string;      // "yyyy-MM-dd HH:mm:ss"
  sortBy?: string;
}

/** Query params cho API bill-legs (page-based). */
export interface BillLegQueryParams {
  page?: number;        // 0-indexed
}
