/**
 * Standardized API Response Envelopes & Error Types
 * Ensures consistent wire formats across backend endpoints and frontend consumers.
 */

export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  version?: string;
}

/**
 * Standard generic response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

/**
 * Successful API response with guaranteed data payload
 */
export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response (avoids stack traces, provides requestId for tracing)
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
  requestId?: string;
  timestamp?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Pagination metadata and envelope for paginated queries
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginatedApiResponse<T> extends ApiResponse<PaginatedData<T>> {
  data: PaginatedData<T>;
}
