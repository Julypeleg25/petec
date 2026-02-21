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
    categoryId: objectIdSchema.optional().nullable(),
    legacyId: z.number().int().optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
    rangeMax: z.union([z.number(), z.string()]).optional().nullable(),
    rangeMin: z.union([z.number(), z.string()]).optional().nullable(),
    totalDose: z.union([z.number(), z.string()]).optional().nullable(),
    routeOfAdministrationId: objectIdSchema.optional().nullable(),
    dosageFrequencyId: objectIdSchema.optional().nullable(),
    measureUnitId: objectIdSchema.optional().nullable(),
    comments: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});
export type CreateMedicineDTO = z.infer<typeof CreateMedicineDTOSchema>;

export const EditMedicineDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional().nullable(),
    categoryId: objectIdSchema.optional().nullable(),
    legacyId: z.number().int().optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
    rangeMax: z.union([z.number(), z.string()]).optional().nullable(),
    rangeMin: z.union([z.number(), z.string()]).optional().nullable(),
    totalDose: z.union([z.number(), z.string()]).optional().nullable(),
    routeOfAdministrationId: objectIdSchema.optional().nullable(),
    dosageFrequencyId: objectIdSchema.optional().nullable(),
    measureUnitId: objectIdSchema.optional().nullable(),
    comments: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});
export type EditMedicineDTO = z.infer<typeof EditMedicineDTOSchema>;

export const CreateAnimalVitalsDTOSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    animalTypeId: objectIdSchema,
    legacyId: z.number().int().optional(),
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
    unit: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});
export type CreateAnimalVitalsDTO = z.infer<typeof CreateAnimalVitalsDTOSchema>;

export const EditAnimalVitalsDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    legacyId: z.number().int().optional(),
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
    unit: z.string().optional().nullable(),
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

export const SimpleSystemTypeDTOSchema = z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean().optional(),
    legacyId: z.number().optional(),
});
export type SimpleSystemTypeDTO = z.infer<typeof SimpleSystemTypeDTOSchema>;
export const SimpleSystemTypeListResponseDTOSchema = z.array(SimpleSystemTypeDTOSchema);
export type SimpleSystemTypeListResponseDTO = z.infer<typeof SimpleSystemTypeListResponseDTOSchema>;

export const AnimalVitalDTOSchema = SimpleSystemTypeDTOSchema.extend({
    animalTypeId: z.string(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    unit: z.string().optional(),
});
export type AnimalVitalDTO = z.infer<typeof AnimalVitalDTOSchema>;
export const AnimalVitalListResponseDTOSchema = z.array(AnimalVitalDTOSchema);
export type AnimalVitalListResponseDTO = z.infer<typeof AnimalVitalListResponseDTOSchema>;

export const RaceTypeDTOSchema = SimpleSystemTypeDTOSchema.extend({
    animalTypeId: z.string(),
});
export type RaceTypeDTO = z.infer<typeof RaceTypeDTOSchema>;
export const RaceTypeListResponseDTOSchema = z.array(RaceTypeDTOSchema);
export type RaceTypeListResponseDTO = z.infer<typeof RaceTypeListResponseDTOSchema>;

export const PopulatedSystemTypeDTOSchema = z.object({
    _id: z.string(),
    name: z.string()
});

export const MedicineDTOSchema = SimpleSystemTypeDTOSchema.extend({
    measureUnitId: PopulatedSystemTypeDTOSchema.optional().nullable(),
    rangeMax: z.number().optional().nullable(),
    rangeMin: z.number().optional().nullable(),
    totalDose: z.number().optional().nullable(),
    comments: z.string().optional().nullable(),
    routeOfAdministrationId: PopulatedSystemTypeDTOSchema.optional().nullable(),
    dosageFrequencyId: PopulatedSystemTypeDTOSchema.optional().nullable(),
    categoryId: PopulatedSystemTypeDTOSchema.optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
});
export type MedicineDTO = z.infer<typeof MedicineDTOSchema>;
export const MedicineListResponseDTOSchema = z.array(MedicineDTOSchema);
export type MedicineListResponseDTO = z.infer<typeof MedicineListResponseDTOSchema>;
