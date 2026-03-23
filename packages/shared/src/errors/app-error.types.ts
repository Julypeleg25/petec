import type { HttpStatus } from "../constants/index.js";
import type { ApiErrorDetails } from "../types/index.js";

export type StatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export interface AppErrorArgs {
  message: string;
  statusCode: StatusCode;
  details?: ApiErrorDetails;
  isOperational?: boolean;
  cause?: Error;
}
