import { z } from "zod";

import {
  requestWithSchema,
} from "../../../lib/apiClient";

import { HTTP_METHODS } from "../../../lib/http.constants";

const ClinicaPetSchema = z.object({
  name: z.string(),
  gender: z.string().optional(),
  breed: z.string().optional(),
  species: z.string().optional(),
  color: z.string().optional(),
  weightKg: z.number().optional(),
  ageYears: z.number().optional(),
  ageMonths: z.number().optional(),
  insurance: z.string().optional(),
  treatingDoctor: z.string().optional(),
  referringDoctor: z.string().optional(),
}).passthrough();

const ClinicaMedicalRecordSchema = z.object({
  recordType: z.string().optional(),
  rawText: z.string().optional(),
  syncedAt: z.string().optional(),
});

const ClinicaRawDataSchema = z.any();

const ClinicaClientSchema = z.object({
  _id: z.string(),
  externalPatientId: z.string().optional(),
  ownerName: z.string(),
  ownerPhone: z.string(),
  pets: z.array(ClinicaPetSchema),
  rawData: ClinicaRawDataSchema.optional(),
  lastSyncedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ClinicaClientsResponseSchema = z.object({
  items: z.array(ClinicaClientSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const ClinicaSyncStatusResponseSchema = z.object({
  isSyncRunning: z.boolean(),
  lastSyncError: z.object({
    name: z.string(),
    message: z.string(),
    occurredAt: z.string(),
  }).nullable().optional(),
});

const ClinicaSyncResultSchema = z.object({
  totalFromClinica: z.number(),
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  syncedAt: z.string(),
});

const ClinicaClientSyncResultSchema = z.object({
  found: z.boolean(),
  outcome: z.string().optional(),
});

export const getClinicaClients = ({
  search,
  page,
  limit,
}: {
  search: string;
  page: number;
  limit: number;
}) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.GET,
      url: "/clinica/clients",
      params: {
        search,
        page,
        limit,
      },
    },
    ClinicaClientsResponseSchema,
  );

export const syncClinicaClients = () =>
  requestWithSchema(
    {
      method: HTTP_METHODS.POST,
      url: "/clinica/clients/sync",
    },
    ClinicaSyncResultSchema,
  );

export const getClinicaSyncStatus = () =>
  requestWithSchema(
    {
      method: HTTP_METHODS.GET,
      url: "/clinica/clients/sync/status",
    },
    ClinicaSyncStatusResponseSchema,
  );

export const syncClinicaClient = (externalPatientId: string) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.POST,
      url: `/clinica/clients/external/${externalPatientId}/sync`,
    },
    ClinicaClientSyncResultSchema,
  );

export const getClinicaClientByExternalPatientId = (externalPatientId: string) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.GET,
      url: `/clinica/clients/external/${externalPatientId}`,
    },
    ClinicaClientSchema,
  );
