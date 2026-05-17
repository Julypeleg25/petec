import { z } from "zod";
import { objectIdSchema } from "../utils/index.js";

const anesthesiaOptionalCommentSchema = z
    .string()
    .max(300, "מותר להזין עד 300 תווים")
    .nullable()
    .optional();

export const AnesthesiaProcedureFormDTOSchema = z.object({
    ownerName: z.string().trim().min(1, "יש להזין שם בעלים"),
    name: z.string().trim().min(1, "יש להזין שם בעל חיים"),
    plannedProcedure: z.string().trim().min(1, "יש להזין פרוצדורה מתוכננת"),
    priceEstimate: z
        .number({ message: "יש להזין מחיר תקין" })
        .min(0, "המחיר חייב להיות גדול או שווה ל-0"),
    date: z.string().nullable().refine((value) => !!value, "יש לבחור תאריך"),
    generalComments: anesthesiaOptionalCommentSchema,
    distortionComments: anesthesiaOptionalCommentSchema,
    medicationsSensitiveComments: anesthesiaOptionalCommentSchema,
    isFastSinceMidnight: z.boolean().nullable().optional(),
    isDistortionHistory: z.boolean().nullable().optional(),
    isMedicationsSensitive: z.boolean().nullable().optional(),
    isNeedToMarkEar: z.boolean().nullable().optional(),
    isSterilization: z.boolean().nullable().optional(),
});
export type AnesthesiaProcedureFormDTO = z.infer<typeof AnesthesiaProcedureFormDTOSchema>;

export const CreateAnesthesiaProcedureFormDTOSchema = z.object({
    caseId: objectIdSchema,
    ownerName: z.string().optional(),
    name: z.string().optional(),
    date: z.coerce.date().optional(),
    signature: z.string().optional(),
    plannedProcedure: z.string().optional(),
    priceEstimate: z.union([z.string(), z.number()]).optional(),
    isFastSinceMidnight: z.boolean().optional(),
    isDistortionHistory: z.boolean().optional(),
    isMedicationsSensitive: z.boolean().optional(),
    isNeedToMarkEar: z.boolean().optional(),
    isSterilization: z.boolean().optional(),
    isPriceIncludesReleaseMedications: z.boolean().optional(),
    generalComments: z.string().optional(),
    distortionComments: z.string().optional(),
    medicationsSensitiveComments: z.string().optional(),
});
export type CreateAnesthesiaProcedureFormDTO = z.infer<typeof CreateAnesthesiaProcedureFormDTOSchema>;

export const EditAnesthesiaProcedureFormDTOSchema = z.object({
    caseId: objectIdSchema,
    ownerName: z.string().optional(),
    name: z.string().optional(),
    date: z.coerce.date().optional(),
    signature: z.string().optional(),
    plannedProcedure: z.string().optional(),
    priceEstimate: z.union([z.string(), z.number()]).optional(),
    isFastSinceMidnight: z.boolean().optional(),
    isDistortionHistory: z.boolean().optional(),
    isMedicationsSensitive: z.boolean().optional(),
    isNeedToMarkEar: z.boolean().optional(),
    isSterilization: z.boolean().optional(),
    isPriceIncludesReleaseMedications: z.boolean().optional(),
    generalComments: z.string().optional(),
    distortionComments: z.string().optional(),
    medicationsSensitiveComments: z.string().optional(),
});
export type EditAnesthesiaProcedureFormDTO = z.infer<typeof EditAnesthesiaProcedureFormDTOSchema>;
