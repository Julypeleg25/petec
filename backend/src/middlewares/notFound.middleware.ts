import { Request, Response, NextFunction } from "express";
import { NotFoundError } from "@utils/errors";

export const notFound = (req: Request, _res: Response, _next: NextFunction): void => {
  throw new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
};
