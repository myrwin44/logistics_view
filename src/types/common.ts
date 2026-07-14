/**
 * Shared common types used across the application.
 */

/**
 * Sort direction union type.
 * Used wherever ascending/descending sort order is needed.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Standard paginated response shape (page-based).
 * Used by list endpoints that return a page of items and a total page count.
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
}

/**
 * Offset-paginated response shape (cursor/offset-based).
 * Used by endpoints that return a full dataset with element count and limit.
 */
export interface OffsetPaginatedResponse<T> {
  data: T[];
  totalElements: number;
  limit: number;
}

// Re-export ApiResponse from api.ts so consumers can import from a single location.
export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './api';
