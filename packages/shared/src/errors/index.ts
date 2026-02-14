import { HttpStatus, ErrorCode } from "../constants/index";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details: unknown;

    constructor(
        message: string,
        statusCode: number,
        code: string,
        isOperational = true,
        details?: unknown,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, true, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
    }
}

export class AuthError extends AppError {
    constructor(message = "Authentication failed") {
        super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Access denied") {
        super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests, please try again later") {
        super(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMITED);
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, false);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, true, details);
    }
}
