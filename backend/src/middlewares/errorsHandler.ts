import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/errors";
import { logger } from "@utils/logger/logger";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
    });
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    statusCode: 500,
  });
};
