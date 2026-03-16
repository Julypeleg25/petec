import type { Types } from "mongoose";
import type { ICase } from "@models/case";

export interface CaseRefsData {
    animalTypeId?: Types.ObjectId;
    genderTypeId?: Types.ObjectId;
    raceTypeId?: Types.ObjectId;
    animalColorId?: Types.ObjectId;
    insuranceTypeId?: Types.ObjectId;
    foodTypeId?: Types.ObjectId;
}

export interface CaseCreateData {
    patientId: Types.ObjectId;
    masterCaseId: Types.ObjectId;
    serialId: string;
    createdByUserId: Types.ObjectId;
    doctorUserId?: Types.ObjectId;
    nurseUserId?: Types.ObjectId;
    admission?: ICase["admission"];
    patientSnapshot?: ICase["patientSnapshot"];
    flags?: ICase["flags"];
    dates?: ICase["dates"];
    comments?: string;
    dailyPlan?: ICase["dailyPlan"];
    refs?: CaseRefsData;
}

export interface PatientUpdateData {
    name?: string;
    owner?: { name: string; phone: string };
    photoName?: string;
    photoPublicId?: string;
}

export interface PatientCreateData {
    serialId: string;
    name: string;
    owner: { name: string; phone: string };
}

export interface CaseUpdateData {
    admission?: ICase["admission"];
    patientSnapshot?: ICase["patientSnapshot"];
    flags?: ICase["flags"];
    dates?: ICase["dates"];
    doctorUserId?: Types.ObjectId;
    nurseUserId?: Types.ObjectId;
    comments?: string;
    dailyPlan?: ICase["dailyPlan"];
    refs?: CaseRefsData;
}

export type CaseUpdateSource = ICase & {
    toObject?: () => ICase;
};

export interface ReleaseMedicineData {
    patientId: Types.ObjectId;
    caseId: Types.ObjectId;
    medicineId: Types.ObjectId;
    dosageFrequencyId?: Types.ObjectId;
    routeOfAdministrationId?: Types.ObjectId;
    measureUnitTypeId?: Types.ObjectId;
    doseAmount?: number | string;
    notes?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface UploadDocumentData {
    patientId: Types.ObjectId;
    caseId: Types.ObjectId;
    patientDocumentTypeId: Types.ObjectId;
    storageKey: string;
    cloudinaryPublicId: string;
    fileName: string;
    uploadedByUserId: Types.ObjectId;
    uploadedAt: Date;
}
