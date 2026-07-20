import type { Document } from "mongoose";
import type { ClinicaClientPet } from "../clinicaClient/index.js";

export interface IClinicaBackfillClient {
  externalPatientId: string;
  ownerName: string;
  ownerPhone: string;
  pets: ClinicaClientPet[];
  sourceDetailStatus: "detail" | "list";
  rawData?: Record<string, unknown>;
  sourceTag: "new";
  lastBackfilledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClinicaBackfillClientDocument = IClinicaBackfillClient & Document;
