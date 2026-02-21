import type { ErrorCode, HttpStatus } from "../constants/index";
import type { ApiErrorDetails } from "../types/index";

export type StatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];
export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface AppErrorArgs {
  message: string;
  statusCode: StatusCode;
  code: ErrorCodeValue;
  details?: ApiErrorDetails;
  isOperational?: boolean;
  cause?: Error;
}
