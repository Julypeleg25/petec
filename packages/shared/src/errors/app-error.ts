import { HttpStatus } from "../constants/index";
import type { ApiErrorDetails } from "../types/index";
import type { AppErrorArgs, StatusCode } from "./app-error.types";

export class AppError extends Error {
  public readonly statusCode: StatusCode;
  public readonly isOperational: boolean;
  public readonly details?: ApiErrorDetails;
  public readonly cause?: Error;

  constructor(args: AppErrorArgs) {
    super(args.message);
    this.name = new.target.name;
    this.statusCode = args.statusCode;
    if (args.details !== undefined) {
      this.details = args.details;
    }
    if (args.cause !== undefined) {
      this.cause = args.cause;
    }
    this.isOperational = args.isOperational ?? true;

    const errorWithCaptureStackTrace = Error as ErrorConstructor & {
      captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
    };

    errorWithCaptureStackTrace.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: ApiErrorDetails) {
    super({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      ...(details !== undefined ? { details } : {}),
      isOperational: true,
    });
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ApiErrorDetails) {
    super({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      ...(details !== undefined ? { details } : {}),
      isOperational: true,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super({
      message,
      statusCode: HttpStatus.NOT_FOUND,
      isOperational: true,
    });
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication failed") {
    super({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      isOperational: true,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super({
      message,
      statusCode: HttpStatus.FORBIDDEN,
      isOperational: true,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super({
      message,
      statusCode: HttpStatus.CONFLICT,
      isOperational: true,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", cause?: Error) {
    super({
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      isOperational: false,
      ...(cause ? { cause } : {}),
    });
  }
}

export type { AppErrorArgs, StatusCode } from "./app-error.types";
