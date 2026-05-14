import type { ClinicaPet } from "./clinicaClient.types";

export interface ClinicaPatientSnapshotState {
  weightKg?: number;
  ageYears?: number;
  ageMonths?: number;
  gender?: string;
  breed?: string;
  species?: string;
  color?: string;
  insurance?: string;
  treatingDoctor?: string;
  referringDoctor?: string;
}

export interface ClinicaNewPatientState {
  source: "clinica";
  clinicaClientId: string;
  externalPatientId?: string;
  caseId: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  patientSnapshot: ClinicaPatientSnapshotState;
  pets: ClinicaPet[];
  comments?: string;
}
