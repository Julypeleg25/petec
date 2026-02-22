import { z } from "zod";
import { objectIdSchema } from "../utils/index";

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
