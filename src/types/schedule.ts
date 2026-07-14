import type { Vehicle } from './transportTrip';

export type ScheduleRunStatus = 'Pending' | 'Completed' | 'Failed';

export interface ScheduleRequest {
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export interface ScheduledStop {
  sequence: number;
  warehouseName: string;
}

export interface ScheduledTrip {
  tripId: string;
  vehicle: Vehicle;
  originWarehouse: string;
  destinationWarehouse: string;
  stops: ScheduledStop[];
  shipmentCount: number;
}

export interface ScheduleRun {
  id: string;
  status: ScheduleRunStatus;
  startDate: string;
  endDate: string;
  generatedTrips: ScheduledTrip[];
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Gantt Chart types — vehicle schedule view (new API structure)
// ---------------------------------------------------------------------------

/** Khoảng thời gian xe đứng tại kho (idle). */
export interface IdleTripSchedule {
  warehouseName: string;
  checkIn: string;          // ISO datetime
  checkOut: string;         // ISO datetime
  totalTime: number;        // phút
  totalUploadBill: number;
  totalUploadWeight: number;
  totalDownloadBill: number;
  totalDownloadWeight: number;
}

/** Khoảng thời gian xe đang di chuyển giữa 2 kho (moving). */
export interface MovingTripSchedule {
  originWarehouse: string;
  destinationWarehouse: string;
  departure: string;        // ISO datetime
  arrival: string;          // ISO datetime
  totalTime: number;        // phút
  distance: number;
  totalBill: number;
  totalLoad: number;
}

/** Một chuyến cụ thể trong lịch trình của xe. */
export interface TripSchedule {
  id: string;   // Snowflake ID
  idleTripSchedules: IdleTripSchedule[];
  movingTripSchedules: MovingTripSchedule[];
}

/** Dữ liệu lịch của một xe (nhóm theo xe, có nhiều chuyến). */
export interface VehicleSchedule {
  licensePlate: string;
  vehicleType: string;
  trips: TripSchedule[];
}

/** Request params cho API lấy Gantt data. */
export interface GanttScheduleRequest {
  startDate: string; // "yyyy-MM-dd HH:mm:ss"
  endDate: string;   // "yyyy-MM-dd HH:mm:ss"
}

/** Wrapper response từ backend cho Gantt/Spatial API. */
export interface GanttApiResponse {
  success: boolean;
  message: string;
  data: VehicleSchedule[];
}
