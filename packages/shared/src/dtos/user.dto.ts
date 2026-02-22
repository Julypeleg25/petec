import { z } from "zod";
import { Role, UserStatus } from "../constants/index";

export const UpdateUserDTOSchema = z.object({
    email: z.string().email().trim().toLowerCase().optional(),
    role: z.nativeEnum(Role).optional(),
    privileges: z.array(z.string()).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});
export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;

export interface UserResponseDTO {
    id: string;
    email: string;
    role: string;
    privileges: string[];
    status: string;
    lastLogin?: string | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterResponseDTO {
    id: string;
    email: string;
    role: string;
}

export interface CreatePatientResponseDTO {
    patientId: string;
    caseId: string;
    masterCaseId: string;
}

export interface PatientDocumentResponseDTO {
    id: string;
    patientId: string;
    caseId?: string;
    patientDocumentTypeId: string;
    fileName: string;
    storageKey: string;
    uploadedByUserId?: string;
    uploadedAt: string;
}

export interface PatientMedicineResponseDTO {
    id: string;
    patientId: string;
    caseId?: string;
    medicineId: string;
    dosageFrequencyId?: string;
    routeOfAdministrationId?: string;
    measureUnitTypeId?: string;
    doseAmount?: number | string;
    notes?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}

export interface ReleaseMedicinesResponseDTO {
    releaseMedicines: PatientMedicineResponseDTO[];
}

export interface ChartsDataResponseDTO {
    caseDetailsGrid: unknown[];
}
