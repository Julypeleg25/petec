import type { Request } from "express";
import { AuthError, BadRequestError } from "../constants/error.constants.js";

export const getParam = (req: Request, key: string): string => {
  const val = req.params[key];
  const parsed = Array.isArray(val) ? val[0] : val;
  if (!parsed) {
    throw new BadRequestError(`Missing route param: ${key}`);
  }
  return parsed;
};

export const getValidatedBody = <T>(req: Request): T => {
  return req.body as T;
};

export const getValidatedParams = <T>(req: Request): T => {
  return req.params as T;
};

export const getValidatedQuery = <T>(req: Request): T => {
  return req.query as T;
};

export const getAuthenticatedUserId = (req: Request): string => {
  const userId = req.authenticatedUser?.userId;
  if (!userId) {
    throw new AuthError("Authentication required");
  }
  return userId;
};
