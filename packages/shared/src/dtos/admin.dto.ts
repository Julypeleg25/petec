import { z } from "zod";
import { objectIdSchema } from "../utils/index";

export const CreateTypeDTOSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    legacyId: z.number().int().optional(),
    animalTypeId: objectIdSchema.optional(),
    isActive: z.boolean().default(true),
});
export type CreateTypeDTO = z.infer<typeof CreateTypeDTOSchema>;

export const EditTypeDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    legacyId: z.number().int().optional(),
    animalTypeId: objectIdSchema.optional(),
    isActive: z.boolean().optional(),
});
export type EditTypeDTO = z.infer<typeof EditTypeDTOSchema>;

export const DeleteTypeDTOSchema = z.object({
    id: objectIdSchema,
});
export type DeleteTypeDTO = z.infer<typeof DeleteTypeDTOSchema>;

export const CreateMedicineDTOSchema = z.object({
    name: z.string().min(1, "Medicine name is required").trim(),
    categoryId: objectIdSchema.optional(),
    legacyId: z.number().int().optional(),
    defaultUnit: z.string().optional(),
    isActive: z.boolean().default(true),
});
export type CreateMedicineDTO = z.infer<typeof CreateMedicineDTOSchema>;

export const EditMedicineDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    categoryId: objectIdSchema.optional(),
    legacyId: z.number().int().optional(),
    defaultUnit: z.string().optional(),
    isActive: z.boolean().optional(),
});
export type EditMedicineDTO = z.infer<typeof EditMedicineDTOSchema>;

export const CreateAnimalVitalsDTOSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    animalTypeId: objectIdSchema,
    legacyId: z.number().int().optional(),
    isActive: z.boolean().default(true),
});
export type CreateAnimalVitalsDTO = z.infer<typeof CreateAnimalVitalsDTOSchema>;

export const EditAnimalVitalsDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    legacyId: z.number().int().optional(),
    isActive: z.boolean().optional(),
});
export type EditAnimalVitalsDTO = z.infer<typeof EditAnimalVitalsDTOSchema>;

export const CreateRaceTypeDTOSchema = z.object({
    name: z.string().min(1, "Race name is required").trim(),
    animalTypeId: objectIdSchema,
    legacyId: z.number().int().optional(),
    isActive: z.boolean().default(true),
});
export type CreateRaceTypeDTO = z.infer<typeof CreateRaceTypeDTOSchema>;

export const EditRaceTypeDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    legacyId: z.number().int().optional(),
    isActive: z.boolean().optional(),
});
export type EditRaceTypeDTO = z.infer<typeof EditRaceTypeDTOSchema>;

export const AdminUserEditDTOSchema = z.object({
    id: objectIdSchema,
    email: z.string().email().optional(),
    role: z.string().optional(),
    privileges: z.array(z.string()).optional(),
    status: z.string().optional(),
});
export type AdminUserEditDTO = z.infer<typeof AdminUserEditDTOSchema>;
