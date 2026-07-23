/**
 * Warehouse service module.
 */

import { apiClient } from './api';
import type { WarehouseResponse } from '../types/warehouse';

export const warehouseService = {
  /** Fetch a list of warehouses by query. */
  getWarehouses: (query: string) =>
    apiClient.get<WarehouseResponse>(`/warehouses?query=${query}`),
};
