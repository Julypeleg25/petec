import type { ErrorRequestHandler } from "express";
import { AppError, ErrorCode, HttpStatus, ValidationError } from "@petec/shared";
import { sendError } from "@utils/apiResponse";
import { logger } from "@utils/logger";
import { maskSensitiveData } from "@utils/sanitizer";
import { ENV } from "@config/config";

const isAppError = (value: Error): value is AppError => value instanceof AppError;

export const errorHandler: ErrorRequestHandler = (error, req, res, next): void => {
    void next;
    const requestId = req.requestId;
    const path = req.originalUrl;
    const method = req.method;
    const details = error instanceof ValidationError ? error.details : undefined;
    const statusCode = isAppError(error) ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorCode = isAppError(error) ? error.code : ErrorCode.INTERNAL_ERROR;
    const message = isAppError(error) ? error.message : "Internal Server Error";

    logger.error("request_failed", {
        requestId,
        path,
        method,
        statusCode,
        errorCode,
        errorMessage: message,
        ...(details !== undefined ? { details: maskSensitiveData(details) } : {}),
        stack: ENV.isProduction ? undefined : error.stack,
    });

    const responseMessage = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && ENV.isProduction
        ? "Internal Server Error"
        : message;

    sendError(res, statusCode, responseMessage, errorCode, details, requestId);
};
