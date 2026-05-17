import type { Response } from "express";
import { z } from "zod";
import { HttpStatus, InternalServerError } from "@petec/shared";
import type { ApiErrorDetail, ApiErrorDetails } from "@petec/shared";
import { logger } from "../config/logger.js";
import { formatZodIssuesForLog } from "./zodError.utils.js";

export type ApiError = Readonly<{
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}>;

export type ApiSuccess<T> = Readonly<{
  success: true;
  data: T;
}>;

export type ApiFailure = Readonly<{
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}>;

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type LogSummaryScalar = string | number | boolean | null | undefined;
type LogSummaryValue = LogSummaryScalar | LogSummaryObject | LogSummaryValue[];
type LogSummaryObject = { [key: string]: LogSummaryValue };
type LogSummarySource = LogSummaryObject | LogSummaryValue[] | null | undefined;

const LOG_SUMMARY_ID_KEYS = [
  "id",
  "_id",
  "caseId",
  "masterCaseId",
  "patientId",
  "documentId",
  "userId",
] as const;

const isLogSummaryObject = (value: LogSummarySource): value is LogSummaryObject =>
  value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value);

const pickSummaryId = (data: LogSummarySource): string | undefined => {
  if (!isLogSummaryObject(data)) return undefined;

  for (const key of LOG_SUMMARY_ID_KEYS) {
    const value = data[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number") return String(value);
  }

  return undefined;
};

const pickSummaryLength = (data: LogSummarySource): number | undefined => {
  if (Array.isArray(data)) return data.length;
  if (!isLogSummaryObject(data)) return undefined;

  const items = data.items;
  if (Array.isArray(items)) return items.length;

  return undefined;
};

const setResponseLogSummary = (
  res: Response,
  data: LogSummarySource,
  note?: string,
): void => {
  const id = pickSummaryId(data);
  const length = pickSummaryLength(data);

  if (id === undefined && length === undefined && note === undefined) {
    return;
  }

  res.locals.logSummary = {
    ...(id !== undefined ? { id } : {}),
    ...(length !== undefined ? { length } : {}),
    ...(note !== undefined ? { note } : {}),
  };
};

const validateResponse = <TSchema extends z.ZodType, TData>(
  res: Response,
  schema: TSchema,
  data: TData,
): z.output<TSchema> => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const req = res.req;
    const path = req.originalUrl.split("?")[0] || req.originalUrl;
    const formattedIssues = formatZodIssuesForLog(parsed.error.issues);

    logger.error("Response validation failed", {
      request_id: req.requestId,
      method: req.method,
      path,
      ...formattedIssues,
    });
    throw new InternalServerError("Response validation failed");
  }

  return parsed.data;
};

const toApiErrorDetailList = (
  details?: ApiErrorDetails,
): ApiErrorDetail[] | undefined => {
  if (!details) {
    return undefined;
  }

  const entries = Object.entries(details)
    .flatMap(([field, messages]) =>
      messages.map((message) => ({
        field,
        message,
      }))
    )
    .sort((left, right) => {
      const fieldComparison = left.field.localeCompare(right.field);
      if (fieldComparison !== 0) return fieldComparison;
      return left.message.localeCompare(right.message);
    });

  return entries.length > 0 ? entries : undefined;
};

export const sendSuccess = <TSchema extends z.ZodType, TData>(
  res: Response,
  data: TData,
  schema: TSchema,
): void => {
  const validated = validateResponse(res, schema, data);
  setResponseLogSummary(res, validated as LogSummarySource);
  res.status(HttpStatus.OK).json({ success: true, data: validated } satisfies ApiSuccess<z.output<TSchema>>);
};

export const sendCreated = <TSchema extends z.ZodType, TData>(
  res: Response,
  data: TData,
  schema: TSchema,
): void => {
  const validated = validateResponse(res, schema, data);
  setResponseLogSummary(res, validated as LogSummarySource, "created");
  res.status(HttpStatus.CREATED).json({ success: true, data: validated } satisfies ApiSuccess<z.output<TSchema>>);
};

export const sendNoContent = (res: Response): void => {
  setResponseLogSummary(res, undefined, "no-content");
  res.status(HttpStatus.NO_CONTENT).send();
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code: string = "INTERNAL_ERROR",
  details?: ApiErrorDetails,
  requestId?: string,
): void => {
  setResponseLogSummary(
    res,
    details !== undefined ? { items: Object.keys(details) } : undefined,
    "error",
  );

  const detailList = toApiErrorDetailList(details);
  const errorPayload: ApiError = {
    code,
    message,
    ...(detailList !== undefined ? { details: detailList } : {}),
    ...(requestId !== undefined ? { requestId } : {}),
  };
  res.status(statusCode).json(errorPayload satisfies ApiFailure);
};

export const sendInternalServerError = (res: Response, requestId?: string): void => {
  sendError(
    res,
    HttpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred",
    "INTERNAL_ERROR",
    undefined,
    requestId,
  );
};
