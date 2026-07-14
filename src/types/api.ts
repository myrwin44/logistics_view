/**
 * Generic API response types for the LGTS View application.
 */

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  message: string;
}

/**
 * Discriminated union of success and error API responses.
 * Narrows to ApiSuccessResponse<T> when ok === true,
 * and to ApiErrorResponse when ok === false.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
