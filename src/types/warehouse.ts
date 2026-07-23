export interface Warehouse {
  id: number;
  name: string;
}

export interface WarehouseResponse {
  success: boolean;
  message: string;
  data: Warehouse[];
}
