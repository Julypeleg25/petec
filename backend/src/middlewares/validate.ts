import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, type ZodIssue } from "zod";
import { ValidationError } from "@utils/errors";
import type { ValidateSchemas } from "@utils/validation.types";
import type { ApiErrorDetails } from "@petec/shared";

const toStrictSchema = (schema: ZodSchema): ZodSchema => {
    if (schema instanceof z.ZodObject) {
        return schema.strict();
    }
    return schema;
};

const toDetails = (issues: readonly ZodIssue[]): ApiErrorDetails => {
    const details: Record<string, string[]> = {};
    for (const issue of issues) {
        const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
        if (!details[key]) {
            details[key] = [];
        }
        details[key].push(issue.message);
    }
    return details;
};

export const validate = (schemas: ValidateSchemas) =>
    (req: Request, res: Response, next: NextFunction): void => {
        if (schemas.body) {
            const result = toStrictSchema(schemas.body).safeParse(req.body);
            if (!result.success) {
                throw new ValidationError("Validation failed", toDetails(result.error.issues));
            }
            req.body = result.data;
        }

        if (schemas.query) {
            const result = toStrictSchema(schemas.query).safeParse(req.query);
            if (!result.success) {
                throw new ValidationError("Query validation failed", toDetails(result.error.issues));
            }
            req.query = result.data as Request["query"];
        }

        if (schemas.params) {
            const result = toStrictSchema(schemas.params).safeParse(req.params);
            if (!result.success) {
                throw new ValidationError("Params validation failed", toDetails(result.error.issues));
            }
            req.params = result.data as Request["params"];
        }

        next();
    };

export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) => validate({ params: schema });
