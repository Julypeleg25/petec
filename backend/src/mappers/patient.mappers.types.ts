import type { Types } from "mongoose";

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
    measureUnitTypeId?: Types.ObjectId | undefined;
    dosageFrequencyId?: Types.ObjectId | undefined;
    routeOfAdministrationId?: Types.ObjectId | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    isActive?: boolean | undefined;
    notes?: string | undefined;
    dosageText?: string | undefined;
    doseAmount?: number | undefined;
}

export interface PlannedProcedureData {
    procedureTypeId: Types.ObjectId;
    plannedProcedureText?: string | undefined;
    scheduledFor?: string | undefined;
    priority?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
}

export interface PlannedFoodExtraData {
    foodExtraTypeId: Types.ObjectId;
    amount?: number | undefined;
    measureUnitTypeId?: Types.ObjectId | undefined;
    frequencyId?: string | undefined;
    notes?: string | undefined;
}

export interface PlannedExaminationData {
    examinationTypeId: Types.ObjectId;
    scheduledFor?: string | undefined;
    notes?: string | undefined;
    status?: string | undefined;
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
    createdByUserId: Types.ObjectId;
    doctorUserId?: Types.ObjectId;
    nurseUserId?: Types.ObjectId;
    admission?: object;
    patientSnapshot?: object;
    flags?: object;
    dates?: object;
    comments?: string;
    dailyPlan?: object;
    refs?: CaseRefsData;
    planned?: PlannedItemData;
}

export interface PatientUpdateData {
  name?: string;
  owner?: { name: string; phone: string };
  photoName?: string;
}

export interface PatientCreateData {
  name: string;
  owner: { name: string; phone: string };
}

export interface CaseUpdateData {
    admission?: object;
    patientSnapshot?: object;
    flags?: object;
    dates?: object;
    doctorUserId?: Types.ObjectId;
    nurseUserId?: Types.ObjectId;
    comments?: string;
    dailyPlan?: object;
    refs?: CaseRefsData;
    planned?: PlannedItemData;
    caseDetailsGrid?: object[];
}

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
