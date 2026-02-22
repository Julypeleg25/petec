import { Request, Response, NextFunction } from "express";
import { AppError, HttpStatus } from "@petec/shared";
import { ZodError } from "zod";
import { sendError } from "@utils/apiResponse";
import { logger } from "@utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(
      res,
      HttpStatus.BAD_REQUEST,
      "Validation failed",
      err.issues,
    );
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    sendError(
      res,
      HttpStatus.BAD_REQUEST,
      "Malformed JSON in request body",
    );
    return;
  }

  logger.error("Unhandled error", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  sendError(
    res,
    HttpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred",
  );
};
