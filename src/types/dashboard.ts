// Chart data point
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardData {
  common: CommonStatistics;
  loads: LoadStatistics;
  warehouses: WarehouseStats[];
}

export interface CommonStatistics {
  totalTrips: {
    totalTrips: number;
    companyTrips: number;
    rentedTrips: number;
  };
  totalVehicles: {
    totalVehicles: number;
    companyVehicles: number;
    rentedVehicles: number;
  };
  totalBills: {
    totalBills: number;
    noTrips: number;
  };
  totalLoads: number;
}

export interface WarehouseStats {
  warehouseName: string;
  totalLoads: number;
  totalInLoad: number;
  totalOutLoad: number;
  totalInBills: number;
  totalOutBills: number;
}

export interface LoadStatItem {
  warehouseName: string;
  totalInLoad?: number;
  totalOutLoad?: number;
  totalInBills?: number;
  totalOutBills?: number;
}

export interface LoadStatistics {
  inLoads: LoadStatItem[];
  outLoads: LoadStatItem[];
}
