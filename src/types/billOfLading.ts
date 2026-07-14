import type { SortDir } from './transportTrip';

export type BillStatus = 'Unscheduled' | 'Scheduled' | 'In Transit' | 'Delivered';

export interface BillListItem {
  id: string;
  originWarehouse: string;
  destinationWarehouse: string;
  weightKg: number;
  status: BillStatus;
  scheduledDate: string | null; // null if Unscheduled
}

export interface BillJourneyStop {
  tripId: string;
  warehouseName: string;
  sequence: number;
  scheduledArrival: string;
  action: 'load' | 'unload';
}

export interface ShipmentBill extends BillListItem {
  createdDate: string;
  journey: BillJourneyStop[];
}

export type BillSortField = 'id' | 'weightKg' | 'status' | 'scheduledDate';

export interface BillQueryParams {
  page: number;
  pageSize: number;
  sortField?: BillSortField;
  sortDir?: SortDir;
  status?: BillStatus[];
  startDate?: string;
  endDate?: string;
  originWarehouse?: string;
  destinationWarehouse?: string;
}
