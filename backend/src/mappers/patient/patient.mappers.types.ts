import type { Types } from "mongoose";
import type { ICase } from "@models/Case";

export interface CaseRefsData {
    animalTypeId?: Types.ObjectId;
    genderTypeId?: Types.ObjectId;
    raceTypeId?: Types.ObjectId;
    animalColorId?: Types.ObjectId;
    insuranceTypeId?: Types.ObjectId;
    foodTypeId?: Types.ObjectId;
}

export interface PlannedMedicineData {
    medicineId: Types.ObjectId;
    measureUnitTypeId?: Types.ObjectId;
    dosageFrequencyId?: Types.ObjectId;
    routeOfAdministrationId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    isDeleted: boolean;
    notes?: string;
    dosageText?: string;
    doseAmount?: number;
}

export interface PlannedProcedureData {
    procedureTypeId: Types.ObjectId;
    plannedProcedureText?: string;
    scheduledFor?: Date;
    priority?: string;
    status: string;
    notes?: string;
}

export interface PlannedFoodExtraData {
    foodExtraTypeId: Types.ObjectId;
    amount?: number;
    measureUnitTypeId?: Types.ObjectId;
    frequencyId?: Types.ObjectId;
    notes?: string;
}

export interface PlannedExaminationData {
    examinationTypeId: Types.ObjectId;
    scheduledFor?: Date;
    notes?: string;
    status?: string;
}

export interface PlannedItemData {
    medicines: PlannedMedicineData[];
    procedures: PlannedProcedureData[];
    foodExtras: PlannedFoodExtraData[];
    examinations: PlannedExaminationData[];
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
    planned?: PlannedItemData;
}

export interface PatientUpdateData {
    name?: string;
    owner?: { name: string; phone: string };
    photoName?: string;
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
    planned?: PlannedItemData;
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
    patientDocumentTypeId: Types.ObjectId;
    storageKey: string;
    fileName: string;
    uploadedByUserId: Types.ObjectId;
    uploadedAt: Date;
    caseId?: Types.ObjectId;
}
