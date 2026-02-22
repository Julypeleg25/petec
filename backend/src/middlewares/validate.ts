import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "@utils/errors";
import type { ValidateSchemas } from "@utils/types";
import { logger } from "@utils/logger";

export const validate = (schemas: ValidateSchemas) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        logger.info("Validating request", { schemas });
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) {
                throw new ValidationError("Validation failed", result.error.issues);
            }
            req.body = result.data;
        }

        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) {
                throw new ValidationError("Query validation failed", result.error.issues);
            }
            req.query = result.data as Record<string, string>;
        }

        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) {
                throw new ValidationError("Params validation failed", result.error.issues);
            }
            req.params = result.data as Record<string, string>;
        }

        next();
    };

export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) => validate({ params: schema });
