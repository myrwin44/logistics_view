/**
 * Bill of lading service module.
 */

import { apiClient, toQueryString } from './api';
import type { BillQueryParams, BillListItem, ShipmentBillDetail } from '../types/billOfLading';
import type { OffsetPaginatedResponse } from '../types/common';

export const billOfLadingService = {
  /** Fetch a paginated, filtered, and sorted list of bills of lading. */
  getBills: (params: BillQueryParams) =>
    apiClient.get<OffsetPaginatedResponse<BillListItem>>(`/bill-legs/bill-of-lading?${toQueryString(params as unknown as Record<string, unknown>)}`),

  /** Fetch a single bill of lading by ID, including its journey track logs. */
  getBillById: (id: string) =>
    apiClient.get<{ success: boolean; message: string; data: ShipmentBillDetail }>(`/bill-legs/bill-of-lading/${id}`)
      .then(response => response.data),
};
