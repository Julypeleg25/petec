import { Request, Response } from "express";
import { ValidationError } from "joi";
import logger from "../../api/utils/Logger";

const errorHandler = (
  err: Error | ValidationError,
  req: Request,
  res: Response,
  next: any
) => {
  logger.error(`${err}`);
  if (err instanceof ValidationError)
    return res.status(400).json({ error: err.message });

  return res.status(500).json({ error: err.message });
};

export default errorHandler;
