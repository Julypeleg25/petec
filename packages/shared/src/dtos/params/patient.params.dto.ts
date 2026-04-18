import { z } from "zod";
import { objectIdSchema } from "../../utils/index.js";

export const CaseIdParamsDTOSchema = z.object({
    caseId: objectIdSchema,
    masterCaseId: objectIdSchema.optional(),
}).strict();
export type CaseIdParamsDTO = z.infer<typeof CaseIdParamsDTOSchema>;

export const PatientIdParamsDTOSchema = z.object({
    patientId: objectIdSchema,
}).strict();
export type PatientIdParamsDTO = z.infer<typeof PatientIdParamsDTOSchema>;

export const DocumentIdParamsDTOSchema = z.object({
    documentId: objectIdSchema,
}).strict();
export type DocumentIdParamsDTO = z.infer<typeof DocumentIdParamsDTOSchema>;

export const CalendarMonthParamsDTOSchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12),
}).strict();
export type CalendarMonthParamsDTO = z.infer<typeof CalendarMonthParamsDTOSchema>;
