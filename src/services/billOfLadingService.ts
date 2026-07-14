/**
 * Bill of lading service module.
 */

import { apiClient, toQueryString } from './api';
import type { BillQueryParams, BillListItem, ShipmentBill } from '../types/billOfLading';
import type { PaginatedResponse } from '../types/common';

export const billOfLadingService = {
  /** Fetch a paginated, filtered, and sorted list of bills of lading. */
  getBills: (params: BillQueryParams) =>
    apiClient.get<PaginatedResponse<BillListItem>>(`/bills?${toQueryString(params as unknown as Record<string, unknown>)}`),

  /** Fetch a single bill of lading by ID, including its journey stops. */
  getBillById: (id: string) =>
    apiClient.get<ShipmentBill>(`/bills/${id}`),
};
