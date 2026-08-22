import { objectIdSchema } from "@petec/shared";
import { z } from "zod";

const requiredText = z.string().trim().min(1).max(200);
const optionalPhone = z.string().trim().max(50).optional();

export const ClinicaClientsQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ClinicaClientsQuery = z.infer<typeof ClinicaClientsQuerySchema>;

export const ClinicaExternalPatientParamsSchema = z
  .object({
    externalPatientId: z.string().trim().regex(/^\d+$/).max(64),
  })
  .strict();

export type ClinicaExternalPatientParams = z.infer<
  typeof ClinicaExternalPatientParamsSchema
>;

export const ClinicaClientParamsSchema = z
  .object({ clientId: objectIdSchema })
  .strict();

export type ClinicaClientParams = z.infer<typeof ClinicaClientParamsSchema>;

export const ClinicaPetQuerySchema = z
  .object({ petName: requiredText })
  .strict();

export type ClinicaPetQuery = z.infer<typeof ClinicaPetQuerySchema>;

export const ClinicaCaseMatchQuerySchema = z
  .object({
    casePrefix: requiredText,
    petName: requiredText,
    ownerPhone: optionalPhone,
  })
  .strict();

export type ClinicaCaseMatchQuery = z.infer<
  typeof ClinicaCaseMatchQuerySchema
>;

export const ClinicaPetVisitsBodySchema = z
  .object({ petName: requiredText })
  .strict();

export type ClinicaPetVisitsBody = z.infer<
  typeof ClinicaPetVisitsBodySchema
>;

export const ClinicaCaseVisitsBodySchema = z
  .object({
    casePrefix: requiredText,
    petName: requiredText,
    ownerPhone: optionalPhone,
  })
  .strict();

export type ClinicaCaseVisitsBody = z.infer<
  typeof ClinicaCaseVisitsBodySchema
>;
