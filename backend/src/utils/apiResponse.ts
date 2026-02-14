import { Response } from "express";
import { HttpStatus } from "@petec/shared";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const sendSuccess = <T>(res: Response, data: T): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(HttpStatus.OK).json(response);
};

export const sendCreated = <T>(res: Response, data: T): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(HttpStatus.CREATED).json(response);
};

export const sendNoContent = (res: Response): void => {
  res.status(HttpStatus.NO_CONTENT).send();
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: statusCode.toString(),
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
};
