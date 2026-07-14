export interface ShipmentPillData {
  billId: string;
}

export interface TripStop {
  id: string;
  tripId: string;
  sequence: number;
  warehouseName: string;
  warehouseLocation: string;
  scheduledArrival: string;    // ISO datetime
  scheduledDeparture: string;  // ISO datetime
  loadedBills: ShipmentPillData[];
  unloadedBills: ShipmentPillData[];
}
