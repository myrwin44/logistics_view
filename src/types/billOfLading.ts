
export type BillStatus = 'ESTIMATED' | 'MODIFIED' | 'ACTUAL';

export interface BillListItem {
  id: string;
  originWarehouse: string;
  destinationWarehouse: string;
  transportTripId: string;
  uploadAt: string;
  downloadAt: string;
  actualWeight: number;
}

export interface BillJourneyStop {
  tripId: string;
  warehouseName: string;
  sequence: number;
  scheduledArrival: string;
  action: 'load' | 'unload';
}

export interface ShipmentBill {
  billId: number;
  VDtype: string;
  service: string;
  originWarehouse: string;
  destinationWarehouse: string;
  actualWeight: number;
  uploadAt: string;
  downloadAt: string;
}

/** Overview block returned by the new detail API */
export interface BillOverview {
  billId: number;
  VDtype: string;
  service: string;
  actualWeight: number;
}

/** A single leg in the shipment journey */
export interface BillTrackLog {
  transportTripId: number;
  licensePlate: string;
  vehicleType: string;
  originWarehouse: string;
  destinationWarehouse: string;
  uploadAt: string;
  downloadAt: string;
}

/** Full detail response (new API shape) */
export interface ShipmentBillDetail {
  billOverview: BillOverview;
  billTrackLogs: BillTrackLog[];
}

export type BillSortField = 'id' | 'actualWeight';

export interface BillQueryParams {
  page: number;
  size: number;
  sort?: string;
  status?: BillStatus;
  id?: string;
  warehouseId?: number;
  transportTripId?: string;
}
