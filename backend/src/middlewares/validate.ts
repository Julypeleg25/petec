import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { ValidationError } from "../constants/error.constants.js";
import type { ValidateSchemas } from "../types/validation.types.js";
import { toValidationErrorDetails } from "../utils/zodError.utils.js";

export const toStrictSchema = (schema: ZodSchema): ZodSchema => {
  if (schema instanceof z.ZodObject) {
    return schema.strict();
  }
  return schema;
};

export const validate =
  (schemas: ValidateSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = toStrictSchema(schemas.body).safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(
          "Validation failed",
          toValidationErrorDetails(result.error.issues),
        );
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = toStrictSchema(schemas.query).safeParse(req.query);
      if (!result.success) {
        throw new ValidationError(
          "Query validation failed",
          toValidationErrorDetails(result.error.issues),
        );
      }
      req.query = result.data as Request["query"];
    }

    if (schemas.params) {
      const result = toStrictSchema(schemas.params).safeParse(req.params);
      if (!result.success) {
        throw new ValidationError(
          "Params validation failed",
          toValidationErrorDetails(result.error.issues),
        );
      }
      req.params = result.data as Request["params"];
    }

    next();
  };

export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) =>
  validate({ params: schema });
