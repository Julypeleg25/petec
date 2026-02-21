import { z } from "zod";
import { objectIdSchema } from "../../utils/index";

export const CaseIdParamsDTOSchema = z.object({
    caseId: objectIdSchema,
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
