import { z } from "zod";

import {
  requestWithSchema,
} from "../../../lib/apiClient";

import { HTTP_METHODS } from "../../../lib/http.constants";

const ClinicaMedicalRecordSchema = z.object({
  patientName: z.string().optional(),
  recordType: z.string().optional(),
  rawText: z.string().optional(),
  table: z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }).optional(),
  syncedAt: z.string().optional(),
});

const ClinicaPetSchema = z.object({
  externalPatientId: z.string().optional(),
  name: z.string(),
  gender: z.string().optional(),
  breed: z.string().optional(),
  species: z.string().optional(),
  color: z.string().optional(),
  weightKg: z.number().optional(),
  ageYears: z.number().optional(),
  ageMonths: z.number().optional(),
  insurance: z.string().optional(),
  microchipNumber: z.string().optional(),
  neutered: z.boolean().optional(),
  notes: z.string().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  treatingDoctor: z.string().optional(),
  referringDoctor: z.string().optional(),
}).passthrough();

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
  visits: z.array(ClinicaMedicalRecordSchema).optional(),
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
  syncStartedAt: z.string().nullable().optional(),
  lastSyncError: z.object({
    name: z.string(),
    message: z.string(),
    occurredAt: z.string(),
  }).nullable().optional(),
  lastSyncResult: z.object({
    totalFromClinica: z.number(),
    created: z.number(),
    updated: z.number(),
    skipped: z.number(),
    syncedAt: z.string(),
  }).nullable().optional(),
});

const ClinicaClientSyncResultSchema = z.object({
  found: z.boolean(),
  outcome: z.string().optional(),
});

const ClinicaSyncResultSchema = z.object({
  totalFromClinica: z.number(),
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  syncedAt: z.string(),
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

export const getClinicaClientByExternalPatientId = (externalPatientId: string) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.GET,
      url: `/clinica/clients/external/${encodeURIComponent(externalPatientId)}`,
    },
    ClinicaClientSchema,
  );

export const getClinicaClientByCasePrefix = (
  casePrefix: string,
  petName: string,
  ownerPhone?: string,
) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.GET,
      url: "/clinica/clients/match/case-prefix",
      params: { casePrefix, petName, ownerPhone },
    },
    ClinicaClientSchema,
  );

export const fetchClinicaVisitsForCase = (
  casePrefix: string,
  petName: string,
  ownerPhone?: string,
) =>
  requestWithSchema(
    {
      method: HTTP_METHODS.POST,
      url: "/clinica/clients/visits/fetch-by-case",
      data: { casePrefix, petName, ownerPhone },
    },
    ClinicaClientSchema,
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
