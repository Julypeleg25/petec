import { z } from "zod";
import { SYSTEM_TYPE_NAMES_VALUES } from "../../constants/index";
import { objectIdSchema } from "../../utils/index";

export const SystemTypeNameParamsDTOSchema = z.object({
    typeName: z.enum(SYSTEM_TYPE_NAMES_VALUES),
}).strict();
export type SystemTypeNameParamsDTO = z.infer<typeof SystemTypeNameParamsDTOSchema>;

export const SystemTypeNameWithIdParamsDTOSchema = z.object({
    typeName: z.enum(SYSTEM_TYPE_NAMES_VALUES),
    id: objectIdSchema,
}).strict();
export type SystemTypeNameWithIdParamsDTO = z.infer<typeof SystemTypeNameWithIdParamsDTOSchema>;

export const SystemTypeByAnimalParamsDTOSchema = z.object({
    typeName: z.enum(SYSTEM_TYPE_NAMES_VALUES),
    animalTypeId: objectIdSchema,
}).strict();
export type SystemTypeByAnimalParamsDTO = z.infer<typeof SystemTypeByAnimalParamsDTOSchema>;

export const UserIdParamsDTOSchema = z.object({
    userId: objectIdSchema,
}).strict();
export type UserIdParamsDTO = z.infer<typeof UserIdParamsDTOSchema>;
