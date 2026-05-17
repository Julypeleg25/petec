export type ApiErrorDetails = Record<string, readonly string[]>;

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type ApiErrorPayload =
  | ApiErrorResponse
  | {
      success: false;
      error: {
        message: string;
        code?: string;
        details?: ApiErrorDetail[];
        requestId?: string;
      };
    }
  | {
      error?: {
        message?: string;
        code?: string;
        details?: ApiErrorDetail[];
        requestId?: string;
      } | string;
    };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
