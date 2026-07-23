/**
 * Dashboard service module.
 */

import { apiClient } from './api';
import type { CommonStatistics, LoadStatistics, WarehouseStats, DashboardData, BillStatItem } from '../types/dashboard';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const dashboardService = {
  /** Fetch aggregated dashboard data for a given date range. */
  getDashboardData: async (startDate: string, endDate: string): Promise<DashboardData> => {
    const start = `${startDate} 00:00:00`;
    const end = `${endDate} 23:59:59`;

    const [commonRes, loadsRes, warehousesRes, billStatsRes] = await Promise.all([
      apiClient.get<ApiResponse<CommonStatistics>>(`/dashboard/common-stats?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`),
      apiClient.get<ApiResponse<LoadStatistics>>(`/dashboard/load-stats?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}&top=10`),
      apiClient.get<ApiResponse<WarehouseStats[]>>(`/dashboard/warehouses-stats?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`),
      apiClient.get<ApiResponse<BillStatItem[]>>(`/dashboard/service-stats?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`),
    ]);

    return {
      common: commonRes.data,
      loads: loadsRes.data,
      warehouses: warehousesRes.data,
      billStats: billStatsRes.data,
    };
  },
};
