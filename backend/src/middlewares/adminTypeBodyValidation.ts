import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";
import {
    SYSTEM_TYPE_NAMES,
    type SystemTypeName,
    CreateMedicineDTOSchema,
    CreateAnimalVitalsDTOSchema,
    CreateTypeDTOSchema,
    EditMedicineDTOSchema,
    EditAnimalVitalsDTOSchema,
    EditTypeDTOSchema,
} from "@petec/shared";
import { ValidationError } from "../constants/error.constants.js";
import { toValidationErrorDetails } from "../utils/zodError.utils.js";

const toStrictSchema = (schema: ZodSchema): ZodSchema => {
    if (schema instanceof z.ZodObject) {
        return schema.strict();
    }
    return schema;
};

const createSchemaByType = (typeName: SystemTypeName): ZodSchema => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return CreateMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return CreateAnimalVitalsDTOSchema;
    }
    return CreateTypeDTOSchema;
};

const updateSchemaByType = (typeName: SystemTypeName): ZodSchema => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return EditMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return EditAnimalVitalsDTOSchema;
    }
    return EditTypeDTOSchema;
};

const getTypeNameParam = (req: Request): SystemTypeName => {
    const value = req.params.typeName;
    return (Array.isArray(value) ? value[0] : value) as SystemTypeName;
};

export const validateAdminCreateTypeBody = (req: Request, _res: Response, next: NextFunction): void => {
    const schema = toStrictSchema(createSchemaByType(getTypeNameParam(req)));
    const result = schema.safeParse(req.body);
    if (!result.success) {
        throw new ValidationError("Validation failed", toValidationErrorDetails(result.error.issues));
    }
    req.body = result.data;
    next();
};

export const validateAdminUpdateTypeBody = (req: Request, _res: Response, next: NextFunction): void => {
    const schema = toStrictSchema(updateSchemaByType(getTypeNameParam(req)));
    const result = schema.safeParse(req.body);
    if (!result.success) {
        throw new ValidationError("Validation failed", toValidationErrorDetails(result.error.issues));
    }
    req.body = result.data;
    next();
};
