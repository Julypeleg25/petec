import { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../constants/error.constants.js";

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  void res;
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
