import type { ErrorRequestHandler } from "express";
import { AppError, HttpStatus, ValidationError } from "@petec/shared";
import { sendError } from "../utils/apiResponse.js";
import { logger } from "../config/logger.js";
import { ENV } from "../config/config.js";

const isAppError = (value: Error): value is AppError =>
  value instanceof AppError;

type ValidationIssueLog = Readonly<{
  path: string;
  message: string;
}>;

type PayloadTooLargeLikeError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

type BodyParserLikeError = SyntaxError & {
  status?: number;
  statusCode?: number;
  type?: string;
  body?: string;
};

type MulterLikeError = Error & {
  code?: string;
  field?: string;
};

type MongoDuplicateKeyError = Error & {
  code?: number;
};

const isMongoDuplicateKeyError = (
  value: Error,
): value is MongoDuplicateKeyError =>
  (value as MongoDuplicateKeyError).code === 11000;

const isPayloadTooLargeError = (
  value: Error,
): value is PayloadTooLargeLikeError => {
  const candidate = value as PayloadTooLargeLikeError;
  return (
    candidate.name === "PayloadTooLargeError" ||
    candidate.type === "entity.too.large" ||
    candidate.status === HttpStatus.PAYLOAD_TOO_LARGE ||
    candidate.statusCode === HttpStatus.PAYLOAD_TOO_LARGE
  );
};

const isInvalidJsonBodyError = (value: Error): value is BodyParserLikeError => {
  const candidate = value as BodyParserLikeError;
  return (
    candidate.name === "SyntaxError" &&
    (candidate.type === "entity.parse.failed" ||
      candidate.status === HttpStatus.BAD_REQUEST ||
      candidate.statusCode === HttpStatus.BAD_REQUEST)
  );
};

const isMulterError = (value: Error): value is MulterLikeError =>
  value.name === "MulterError";

const isMulterFileSizeError = (value: Error): value is MulterLikeError =>
  isMulterError(value) && (value as MulterLikeError).code === "LIMIT_FILE_SIZE";

const isMulterUnexpectedFileError = (value: Error): value is MulterLikeError =>
  isMulterError(value) &&
  (value as MulterLikeError).code === "LIMIT_UNEXPECTED_FILE";

const toAppErrorCode = (error: AppError): string => {
  switch (error.name) {
    case "ValidationError":
      return "VALIDATION_ERROR";
    case "BadRequestError":
      return "BAD_REQUEST";
    case "AuthError":
      return "UNAUTHORIZED";
    case "ForbiddenError":
      return "FORBIDDEN";
    case "NotFoundError":
      return "NOT_FOUND";
    case "ConflictError":
      return "CONFLICT";
    case "InternalServerError":
      return "INTERNAL_ERROR";
    case "ClinicalSummaryUnavailableError":
      return "CLINICAL_SUMMARY_UNAVAILABLE";
    default:
      return error.name
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^A-Za-z0-9]+/g, "_")
        .toUpperCase();
  }
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
): void => {
  void next;
  const payloadTooLarge = !isAppError(error) && isPayloadTooLargeError(error);
  const invalidJsonBody = !isAppError(error) && isInvalidJsonBodyError(error);
  const multerFileSizeError =
    !isAppError(error) && isMulterFileSizeError(error);
  const multerUnexpectedFileError =
    !isAppError(error) && isMulterUnexpectedFileError(error);
  const mongoDuplicateKeyError =
    !isAppError(error) && isMongoDuplicateKeyError(error);
  const requestId = req.requestId;
  const path = req.originalUrl.split("?")[0] || req.originalUrl;
  const method = req.method;
  const route = `${method} ${path}`;
  const statusCode = isAppError(error)
    ? error.statusCode
    : mongoDuplicateKeyError
      ? HttpStatus.CONFLICT
      : invalidJsonBody
        ? HttpStatus.BAD_REQUEST
        : multerFileSizeError || payloadTooLarge
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : multerUnexpectedFileError
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR;
  const message = isAppError(error)
    ? error.message
    : mongoDuplicateKeyError
      ? "Resource already exists"
      : invalidJsonBody
        ? "Invalid JSON body"
        : multerFileSizeError
          ? "File is too large"
          : multerUnexpectedFileError
            ? "Invalid file field"
            : payloadTooLarge
              ? "Payload too large"
              : "Internal Server Error";
  const errorCode = isAppError(error)
    ? toAppErrorCode(error)
    : mongoDuplicateKeyError
      ? "CONFLICT"
      : invalidJsonBody
        ? "INVALID_JSON_BODY"
        : multerFileSizeError
          ? "FILE_TOO_LARGE"
          : multerUnexpectedFileError
            ? "INVALID_FILE_FIELD"
            : payloadTooLarge
              ? "PAYLOAD_TOO_LARGE"
              : "UNKNOWN_ERROR";
  const details =
    error instanceof ValidationError
      ? error.details
      : invalidJsonBody
        ? { body: ["Request body contains invalid JSON"] }
        : undefined;

  const validationIssues = details
    ? Object.entries(details)
        .flatMap(([fieldPath, messages]) =>
          messages.map((msg) => ({ path: fieldPath, message: msg })),
        )
        .sort((left, right) => {
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
    event: "http_request_failed",
    outcome: "failure",
    request_id: requestId,
    error_name: error.name,
    error_message: error instanceof Error ? error.message : String(error),
    error_code: errorCode,
    http_status: statusCode,
    route,
    ...(typeof req.headers["content-type"] === "string"
      ? { content_type: req.headers["content-type"] }
      : {}),
    ...(req.ctx?.user ? { user_id: req.ctx.user.userId } : {}),
    ...(validationIssues
      ? { validation_issue_count: validationIssues.length }
      : {}),
    ...(validationIssuePaths
      ? { validation_issue_paths: validationIssuePaths }
      : {}),
    ...(validationIssues
      ? { validation_issues: validationIssues as ValidationIssueLog[] }
      : {}),
    ...(error.cause instanceof Error ? { cause: error.cause.message } : {}),
    ...(!ENV.isProduction || !isAppError(error) || !error.isOperational
      ? { stack: error.stack }
      : {}),
  };

  const logMessage = `[${route}] request failed`;

  if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(logMessage, logMeta);
  } else {
    logger.warn(logMessage, logMeta);
  }

  const isSafeClinicalSummaryError =
    isAppError(error) && error.name === "ClinicalSummaryUnavailableError";
  const responseMessage =
    statusCode >= HttpStatus.INTERNAL_SERVER_ERROR &&
    ENV.isProduction &&
    !isSafeClinicalSummaryError
      ? "Internal Server Error"
      : message;

  sendError(res, statusCode, responseMessage, errorCode, details, requestId);
};
