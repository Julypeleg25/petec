import type { Document, Types } from "mongoose";

export interface ClinicaClientPet {
  externalPatientId?: string;
  name: string;
  gender?: string;
  breed?: string;
  species?: string;
  color?: string;
  weightKg?: number;
  ageYears?: number;
  ageMonths?: number;
  insurance?: string;
  treatingDoctor?: string;
  referringDoctor?: string;
  medicalRecords?: Array<{
    patientName: string;
    ownerName: string;
    ownerPhone: string;
    recordType: string;
    rawText: string;
    table?: { headers: string[]; rows: string[][] };
    syncedAt: Date;
  }>;
}

export interface IClinicaClient {
  externalPatientId?: string;
  ownerName: string;
  ownerPhone: string;
  pets: ClinicaClientPet[];
  rawData: Record<string, unknown>;
  lastSyncedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClinicaClientDocument = IClinicaClient &
  Document<Types.ObjectId>;
