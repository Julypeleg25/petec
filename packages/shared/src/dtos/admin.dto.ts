import { z } from "zod";
import { objectIdSchema } from "../utils/index";
import {
    optionalNullableNonNegativeNumberInputSchema,
    optionalNullableObjectIdInputSchema,
    numberStringSchema
} from "../utils/zod.utils";
import type { SystemTypeName } from "../constants";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const CreateTypeDTOSchema = z.object({
    name: z.string().min(1, "יש להזין שם").trim(),
    description: z.string().trim().optional().nullable(),
    serialId: z.string().trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    isDeleted: z.boolean().optional(),
});
export type CreateTypeDTO = z.infer<typeof CreateTypeDTOSchema>;

export const EditTypeDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    description: z.string().trim().optional().nullable(),
    serialId: z.string().trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    isDeleted: z.boolean().optional(),
});
export type EditTypeDTO = z.infer<typeof EditTypeDTOSchema>;

export const DeleteTypeDTOSchema = z.object({
    id: objectIdSchema,
});
export type DeleteTypeDTO = z.infer<typeof DeleteTypeDTOSchema>;

export const CreateMedicineDTOSchema = z.object({
    name: z.string().min(1, "יש להזין שם תרופה").trim(),
    description: z.string().trim().optional().nullable(),
    categoryId: objectIdSchema.optional().nullable(),
    serialId: z.string().trim().optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
    rangeMax: z.union([z.number(), z.string()]).optional().nullable(),
    rangeMin: z.union([z.number(), z.string()]).optional().nullable(),
    totalDose: z.union([z.number(), z.string()]).optional().nullable(),
    routeOfAdministrationId: objectIdSchema.optional().nullable(),
    dosageFrequencyId: objectIdSchema.optional().nullable(),
    measureUnitTypeId: objectIdSchema.optional().nullable(),
    comments: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
});
export type CreateMedicineDTO = z.infer<typeof CreateMedicineDTOSchema>;

const requiredObjectId = z.string().trim().min(1, "שדה חובה").regex(/^[0-9a-fA-F]{24}$/, "מזהה לא תקין");

export const SaveMedicineFormDTOSchema = CreateMedicineDTOSchema.extend({
    categoryId: requiredObjectId,
    measureUnitTypeId: requiredObjectId,
    dosageFrequencyId: requiredObjectId,
    routeOfAdministrationId: requiredObjectId,
    rangeMax: optionalNullableNonNegativeNumberInputSchema.optional(),
    rangeMin: optionalNullableNonNegativeNumberInputSchema.optional(),
    totalDose: optionalNullableNonNegativeNumberInputSchema.optional(),
    comments: z
        .string()
        .max(300, "מותר להזין עד 300 תווים")
        .nullable()
        .optional(),
}).refine(
    (data) => {
        if (data.rangeMax != null && data.rangeMin != null) {
            return data.rangeMax >= data.rangeMin;
        }
        return true;
    },
    {
        message: "טווח מקסימום חייב להיות גדול או שווה לטווח מינימום",
        path: ["rangeMax"],
    },
);
export type SaveMedicineFormDTO = z.infer<typeof SaveMedicineFormDTOSchema>;

export const EditMedicineDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    categoryId: objectIdSchema.optional().nullable(),
    serialId: z.string().trim().optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
    rangeMax: z.union([z.number(), z.string()]).optional().nullable(),
    rangeMin: z.union([z.number(), z.string()]).optional().nullable(),
    totalDose: z.union([z.number(), z.string()]).optional().nullable(),
    routeOfAdministrationId: objectIdSchema.optional().nullable(),
    dosageFrequencyId: objectIdSchema.optional().nullable(),
    measureUnitTypeId: objectIdSchema.optional().nullable(),
    comments: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
});
export type EditMedicineDTO = z.infer<typeof EditMedicineDTOSchema>;

export const CreateAnimalVitalsDTOSchema = z.object({
    name: z.string().min(1, "יש להזין שם").trim(),
    animalTypeId: objectIdSchema,
    vitalsType: z.string().trim().optional(),
    rangeMin: z.number().optional().nullable(),
    rangeMax: z.number().optional().nullable(),
    serialId: z.string().trim().optional(),
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
    unit: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
});
export type CreateAnimalVitalsDTO = z.infer<typeof CreateAnimalVitalsDTOSchema>;

const animalVitalTypeSchema = z
    .string()
    .trim()
    .min(1, "שדה חובה")
    .refine((value) => ["T", "P", "R"].includes(value), "סוג התראה לא תקין");

export const SaveAnimalVitalsFormDTOSchema = z
    .object({
        animalTypeId: objectIdSchema,
        name: animalVitalTypeSchema,
        minValue: optionalNullableNonNegativeNumberInputSchema.optional(),
        maxValue: optionalNullableNonNegativeNumberInputSchema.optional(),
    })
    .refine(
        (data) => {
            if (data.maxValue != null && data.minValue != null) {
                return data.maxValue >= data.minValue;
            }
            return true;
        },
        {
            message: "מקסימום חייב להיות גדול או שווה למינימום",
            path: ["maxValue"],
        },
    );
export type SaveAnimalVitalsFormDTO = z.infer<typeof SaveAnimalVitalsFormDTOSchema>;

export const EditAnimalVitalsDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    vitalsType: z.string().trim().optional(),
    rangeMin: z.number().optional().nullable(),
    rangeMax: z.number().optional().nullable(),
    serialId: z.string().trim().optional(),
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
    unit: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
});
export type EditAnimalVitalsDTO = z.infer<typeof EditAnimalVitalsDTOSchema>;

export const CreateRaceTypeDTOSchema = z.object({
    name: z.string().min(1, "יש להזין שם גזע").trim(),
    animalTypeId: objectIdSchema,
    serialId: z.string().trim().optional(),
    isDeleted: z.boolean().optional(),
});
export type CreateRaceTypeDTO = z.infer<typeof CreateRaceTypeDTOSchema>;

export const SaveRaceTypeFormDTOSchema = CreateRaceTypeDTOSchema.pick({
    name: true,
    animalTypeId: true,
});
export type SaveRaceTypeFormDTO = z.infer<typeof SaveRaceTypeFormDTOSchema>;

export const EditRaceTypeDTOSchema = z.object({
    id: objectIdSchema,
    name: z.string().min(1).trim().optional(),
    animalTypeId: objectIdSchema.optional(),
    serialId: z.string().trim().optional(),
    isDeleted: z.boolean().optional(),
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
    description: z.string().optional().nullable(),
    isDeleted: z.boolean().optional(),
    serialId: z.string().optional(),
});
export type SimpleSystemTypeDTO = z.infer<typeof SimpleSystemTypeDTOSchema>;
export const SimpleSystemTypeListResponseDTOSchema = z.array(SimpleSystemTypeDTOSchema);
export type SimpleSystemTypeListResponseDTO = z.infer<typeof SimpleSystemTypeListResponseDTOSchema>;

export const AnimalVitalDTOSchema = SimpleSystemTypeDTOSchema.extend({
    animalTypeId: z.string(),
    vitalsType: z.string().optional(),
    rangeMin: z.number().optional(),
    rangeMax: z.number().optional(),
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
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    serialId: z.string().optional(),
    isDeleted: z.boolean().optional(),
    type: z.string().optional(),
    createdAt: isoDateTimeSchema.optional(),
    updatedAt: isoDateTimeSchema.nullable().optional(),
});

export const MedicineReferenceDTOSchema = PopulatedSystemTypeDTOSchema;

export const MedicineDTOSchema = SimpleSystemTypeDTOSchema.extend({
    measureUnitType: MedicineReferenceDTOSchema.optional().nullable(),
    rangeMax: z.number().optional().nullable(),
    rangeMin: z.number().optional().nullable(),
    totalDose: z.number().optional().nullable(),
    comments: z.string().optional().nullable(),
    routeOfAdministration: MedicineReferenceDTOSchema.optional().nullable(),
    dosageFrequency: MedicineReferenceDTOSchema.optional().nullable(),
    category: MedicineReferenceDTOSchema.optional().nullable(),
    defaultUnit: z.string().optional().nullable(),
});
export type MedicineDTO = z.infer<typeof MedicineDTOSchema>;
export const MedicineListResponseDTOSchema = z.array(MedicineDTOSchema);
export type MedicineListResponseDTO = z.infer<typeof MedicineListResponseDTOSchema>;

type TextSystemTypeFieldSchemaConfig = {
    kind: "text";
    name: string;
    label: string;
    required?: boolean;
    sourceKey?: string;
};

type NumberSystemTypeFieldSchemaConfig = {
    kind: "number";
    name: string;
    label: string;
    min?: number;
    required?: boolean;
    sourceKey?: string;
};

type StaticSelectSystemTypeFieldSchemaConfig = {
    kind: "static-select";
    name: string;
    label: string;
    options: { value: string; text: string }[];
    required?: boolean;
    disabledOnEdit?: boolean;
    sourceKey?: string;
};

type DynamicSelectSystemTypeFieldSchemaConfig = {
    kind: "dynamic-select";
    name: string;
    label: string;
    sourceTypeName: SystemTypeName;
    required?: boolean;
    disabledOnEdit?: boolean;
    sourceKey?: string;
};

export type SystemTypeFormFieldSchemaConfig =
    | TextSystemTypeFieldSchemaConfig
    | NumberSystemTypeFieldSchemaConfig
    | StaticSelectSystemTypeFieldSchemaConfig
    | DynamicSelectSystemTypeFieldSchemaConfig;



export const buildSystemTypeFormSchema = (
    fields: readonly SystemTypeFormFieldSchemaConfig[],
) => {
    const schemaShape: Record<string, z.ZodType<string>> = {};

    for (const field of fields) {
        if (field.kind === "text") {
            schemaShape[field.name] = field.required
                ? z.string().trim().min(1, `${field.label} הוא שדה חובה`)
                : z.string().trim();
            continue;
        }

        if (field.kind === "number") {
            schemaShape[field.name] = numberStringSchema(
                field.label,
                field.min,
                field.required,
            );
            continue;
        }

        schemaShape[field.name] = field.required
            ? z.string().trim().min(1, `${field.label} הוא שדה חובה`)
            : z.string().trim();
    }

    return z.object(schemaShape);
};
