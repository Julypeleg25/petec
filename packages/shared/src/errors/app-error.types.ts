import type { HttpStatus } from "../constants/index";
import type { ApiErrorDetails } from "../types/index";

export type StatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export interface AppErrorArgs {
  message: string;
  statusCode: StatusCode;
  details?: ApiErrorDetails;
  isOperational?: boolean;
  cause?: Error;
}
