import type { ErrorRequestHandler } from "express";
import { AppError, HttpStatus, ValidationError } from "@petec/shared";
import { sendError } from "../utils/apiResponse.js";
import { logger } from "../config/logger.js";
import { ENV } from "../config/config.js";

const isAppError = (value: Error): value is AppError => value instanceof AppError;

type ValidationIssueLog = Readonly<{
    path: string;
    message: string;
}>;

type PayloadTooLargeLikeError = Error & {
    status?: number;
    statusCode?: number;
    type?: string;
};

type MulterLikeError = Error & {
    code?: string;
    field?: string;
};

const isPayloadTooLargeError = (value: Error): value is PayloadTooLargeLikeError => {
    const candidate = value as PayloadTooLargeLikeError;
    return candidate.name === "PayloadTooLargeError"
        || candidate.type === "entity.too.large"
        || candidate.status === HttpStatus.PAYLOAD_TOO_LARGE
        || candidate.statusCode === HttpStatus.PAYLOAD_TOO_LARGE;
};

const isMulterError = (value: Error): value is MulterLikeError =>
    value.name === "MulterError";

const isMulterFileSizeError = (value: Error): value is MulterLikeError =>
    isMulterError(value) && (value as MulterLikeError).code === "LIMIT_FILE_SIZE";

const isMulterUnexpectedFileError = (value: Error): value is MulterLikeError =>
    isMulterError(value) && (value as MulterLikeError).code === "LIMIT_UNEXPECTED_FILE";

export const errorHandler: ErrorRequestHandler = (error, req, res, next): void => {
    void next;
    const payloadTooLarge = !isAppError(error) && isPayloadTooLargeError(error);
    const multerFileSizeError = !isAppError(error) && isMulterFileSizeError(error);
    const multerUnexpectedFileError = !isAppError(error) && isMulterUnexpectedFileError(error);
    const requestId = req.requestId;
    const path = req.originalUrl.split("?")[0] || req.originalUrl;
    const method = req.method;
    const route = `${method} ${path}`;
    const statusCode = isAppError(error)
        ? error.statusCode
        : multerFileSizeError || payloadTooLarge
            ? HttpStatus.PAYLOAD_TOO_LARGE
            : multerUnexpectedFileError
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isAppError(error)
        ? error.message
        : multerFileSizeError
            ? "File is too large"
            : multerUnexpectedFileError
                ? "Invalid file field"
                : payloadTooLarge
                    ? "Payload too large"
                    : "Internal Server Error";
    const errorCode = isAppError(error)
        ? error.name
        : multerFileSizeError
            ? "FILE_TOO_LARGE"
            : multerUnexpectedFileError
                ? "INVALID_FILE_FIELD"
                : payloadTooLarge
                    ? "PAYLOAD_TOO_LARGE"
                    : "UNKNOWN_ERROR";
    const details = error instanceof ValidationError ? error.details : undefined;

    const validationIssues = details
        ? Object.entries(details).flatMap(([fieldPath, messages]) =>
            messages.map((msg) => ({ path: fieldPath, message: msg }))
        ).sort((left, right) => {
            const pathComparison = left.path.localeCompare(right.path);
            if (pathComparison !== 0) return pathComparison;
            return left.message.localeCompare(right.message);
        })
        : undefined;

    const validationIssuePaths = validationIssues
        ? [...new Set(validationIssues.map((issue) => issue.path))]
        : undefined;

    const logMeta = {
        module: "http",
        request_id: requestId,
        error_name: error.name,
        error_code: errorCode,
        http_status: statusCode,
        route,
        ...(req.ctx?.user ? { user_id: req.ctx.user.userId } : {}),
        ...(validationIssues ? { validation_issue_count: validationIssues.length } : {}),
        ...(validationIssuePaths ? { validation_issue_paths: validationIssuePaths } : {}),
        ...(validationIssues ? { validation_issues: validationIssues as ValidationIssueLog[] } : {}),
        ...(error.cause instanceof Error ? { cause: error.cause.message } : {}),
        ...(!ENV.isProduction ? { stack: error.stack } : {}),
    };

    const logMessage = `[${route}] request failed`;

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        logger.error(logMessage, logMeta);
    } else {
        logger.warn(logMessage, logMeta);
    }

    const responseMessage = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && ENV.isProduction
        ? "Internal Server Error"
        : message;

    sendError(res, statusCode, responseMessage, errorCode, details, requestId);
};
