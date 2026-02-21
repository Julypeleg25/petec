import type { Response } from "express";
import { z } from "zod";
import { ErrorCode, HttpStatus, InternalServerError } from "@petec/shared";
import type { ApiErrorDetails } from "@petec/shared";

export type ApiError = Readonly<{
  code: string;
  message: string;
  details?: ApiErrorDetails;
  requestId?: string;
}>;

export type ApiSuccess<T> = Readonly<{
  success: true;
  data: T;
}>;

export type ApiFailure = Readonly<{
  success: false;
  error: ApiError;
}>;

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const validateResponse = <TSchema extends z.ZodType, TData>(schema: TSchema, data: TData): z.output<TSchema> => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new InternalServerError("Response validation failed");
  }

  return parsed.data;
};

export const sendSuccess = <TSchema extends z.ZodType, TData>(
  res: Response,
  data: TData,
  schema: TSchema,
): void => {
  const validated = validateResponse(schema, data);
  res.status(HttpStatus.OK).json({ success: true, data: validated } satisfies ApiSuccess<z.output<TSchema>>);
};

export const sendCreated = <TSchema extends z.ZodType, TData>(
  res: Response,
  data: TData,
  schema: TSchema,
): void => {
  const validated = validateResponse(schema, data);
  res.status(HttpStatus.CREATED).json({ success: true, data: validated } satisfies ApiSuccess<z.output<TSchema>>);
};

export const sendNoContent = (res: Response): void => {
  res.status(HttpStatus.NO_CONTENT).send();
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: ApiErrorDetails,
  requestId?: string,
): void => {
  const errorPayload = {
    code,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(requestId !== undefined ? { requestId } : {}),
  };
  res.status(statusCode).json({
    success: false,
    error: errorPayload,
  } satisfies ApiFailure);
};

export const sendInternalServerError = (res: Response, requestId?: string): void => {
  sendError(
    res,
    HttpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred",
    ErrorCode.INTERNAL_ERROR,
    undefined,
    requestId,
  );
};
