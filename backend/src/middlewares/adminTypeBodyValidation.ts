import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";
import {
    SYSTEM_TYPE_NAMES,
    CreateMedicineDTOSchema,
    CreateAnimalVitalsDTOSchema,
    CreateTypeDTOSchema,
    EditMedicineDTOSchema,
    EditAnimalVitalsDTOSchema,
    EditTypeDTOSchema,
} from "@petec/shared";
import { ValidationError } from "@utils/errors";
import type { ApiErrorDetails } from "@petec/shared";

const toStrictSchema = (schema: ZodSchema): ZodSchema => {
    if (schema instanceof z.ZodObject) {
        return schema.strict();
    }
    return schema;
};

const toDetails = (issues: readonly z.ZodIssue[]): ApiErrorDetails => {
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

const createSchemaByType = (typeName: string): ZodSchema => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return CreateMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return CreateAnimalVitalsDTOSchema;
    }
    return CreateTypeDTOSchema;
};

const updateSchemaByType = (typeName: string): ZodSchema => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return EditMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return EditAnimalVitalsDTOSchema;
    }
    return EditTypeDTOSchema;
};

const getTypeNameParam = (req: Request): string => {
    const value = req.params.typeName;
    return Array.isArray(value) ? value[0] : value;
};

export const validateAdminCreateTypeBody = (req: Request, res: Response, next: NextFunction): void => {
    const schema = toStrictSchema(createSchemaByType(getTypeNameParam(req)));
    const result = schema.safeParse(req.body);
    if (!result.success) {
        throw new ValidationError("Validation failed", toDetails(result.error.issues));
    }
    req.body = result.data;
    next();
};

export const validateAdminUpdateTypeBody = (req: Request, res: Response, next: NextFunction): void => {
    const schema = toStrictSchema(updateSchemaByType(getTypeNameParam(req)));
    const result = schema.safeParse(req.body);
    if (!result.success) {
        throw new ValidationError("Validation failed", toDetails(result.error.issues));
    }
    req.body = result.data;
    next();
};
