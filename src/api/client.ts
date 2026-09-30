/**
 * Standardized API Client with Request Tracing, Auth Injection, and Type Safety
 */

import { AUTH_TOKEN_KEY } from '../utils/userStore';
import { ApiResponse, ApiErrorResponse } from './types/response';

export class ApiClientError extends Error {
  statusCode: number;
  errorType: string;
  requestId?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, errorType = 'InternalServerError', requestId?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.requestId = requestId;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

/**
 * Generate a client-side request correlation ID
 */
function generateRequestId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Core typed fetch wrapper
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth = false, headers: customHeaders, ...rest } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const requestId = generateRequestId();
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Request-Id', requestId);

  if (!skipAuth && !headers.has('Authorization')) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  const responseRequestId = response.headers.get('x-request-id') || requestId;

  // Attempt to parse JSON response
  let json: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorPayload = json as ApiErrorResponse | null;
    const message = errorPayload?.message || errorPayload?.error || `Yêu cầu thất bại với mã trạng thái ${response.status}`;
    const errorType = errorPayload?.error || (response.status >= 500 ? 'InternalServerError' : 'ApiError');
    
    throw new ApiClientError(
      message,
      response.status,
      errorType,
      errorPayload?.requestId || responseRequestId,
      errorPayload
    );
  }

  return (json !== null ? json : ({} as any)) as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
