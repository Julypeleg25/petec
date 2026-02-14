import { HydratedDocument, Types } from "mongoose";

export interface ICaseDetailsMedicineObj {
    medicineId: Types.ObjectId;
    name?: string;
    dosageText?: string;
    doseAmount?: number;
    measureUnitTypeId?: Types.ObjectId;
    isGiven?: boolean;
    isRequired: boolean;
    isEditable: boolean;
    comment?: string;
}

export interface ICaseDetailsOptionsObj {
    typeId: Types.ObjectId;
    name?: string;
    isGiven?: boolean;
    isRequired: boolean;
    isEditable: boolean;
    comment?: string;
}

export interface ICaseDetailsRow {
    date: string;
    time: string;
    index: number;

    temperature?: number;
    temperatureIsRequired?: boolean;
    temperatureIsEditable?: boolean;

    pulse?: number;
    pulseIsRequired?: boolean;
    pulseIsEditable?: boolean;

    respiration?: number;
    respirationIsRequired?: boolean;
    respirationIsEditable?: boolean;

    urineTypeId?: Types.ObjectId;
    urineComments?: string;
    urineIsRequired?: boolean;
    urineIsEditable?: boolean;

    fecesTypeId?: Types.ObjectId;
    fecesComments?: string;
    fecesIsRequired?: boolean;
    fecesIsEditable?: boolean;

    isBoxClean?: boolean;
    isBoxCleanIsRequired?: boolean;
    isBoxCleanIsEditable?: boolean;

    isRelease?: boolean;
    isReleaseIsRequired?: boolean;
    isReleaseIsEditable?: boolean;

    foodGiven?: boolean;
    waterGiven?: boolean;

    fluids: ICaseDetailsMedicineObj[];
    medicines: ICaseDetailsMedicineObj[];
    procedures: ICaseDetailsOptionsObj[];
    examinations: ICaseDetailsOptionsObj[];
    foodExtras: ICaseDetailsOptionsObj[];
}

export interface IPlannedMedicine {
    medicineId: Types.ObjectId;
    dosageText?: string;
    doseAmount?: number;
    measureUnitTypeId?: Types.ObjectId;
    dosageFrequencyId?: Types.ObjectId;
    routeOfAdministrationId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    notes?: string;
}

export interface IPlannedProcedure {
    procedureTypeId: Types.ObjectId;
    plannedProcedureText?: string;
    scheduledFor?: Date;
    priority?: string;
    status: string;
    notes?: string;
}

export interface IPlannedFoodExtra {
    foodExtraTypeId: Types.ObjectId;
    amount?: number;
    measureUnitTypeId?: Types.ObjectId;
    frequencyId?: Types.ObjectId;
    notes?: string;
}

export interface IPlannedExamination {
    examinationTypeId: Types.ObjectId;
    scheduledFor?: Date;
    notes?: string;
    status?: string;
}

export interface ICase {
    _id: Types.ObjectId;
    patientId: Types.ObjectId;
    masterCaseId?: Types.ObjectId;

    createdByUserId?: Types.ObjectId;
    doctorUserId?: Types.ObjectId;
    nurseUserId?: Types.ObjectId;
    releasedByUserId?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
    releaseDate?: Date;
    isArchived: boolean;
    isDeleted: boolean;

    admission: {
        hospitalizationReason?: string;
        referringDoctor?: string;
        allergicComments?: string | null;
        bloodTestLink?: string | null;
    };

    patientSnapshot: {
        ageYears?: number;
        ageMonths?: number;
        weightKg?: number;
    };

    flags: {
        isAllergic?: boolean;
        isEscapePotential?: boolean;
        isNPO?: boolean;
        isRiskAnesthesia?: boolean;
        isHeartMurmur?: boolean;
        isAMB?: boolean;
        isAggressive?: boolean;
        isConvenia?: boolean;
        isCerenia?: boolean;
        isProcedure?: boolean;
    };

    dates: {
        catheterDate?: Date;
        procedureDate?: Date;
        nextInspectionDate?: Date;
        stitchesRemovalDate?: Date;
    };

    refs: {
        animalTypeId?: Types.ObjectId;
        genderTypeId?: Types.ObjectId;
        raceTypeId?: Types.ObjectId;
        animalColorId?: Types.ObjectId;
        insuranceTypeId?: Types.ObjectId;
        foodTypeId?: Types.ObjectId;
    };

    comments?: string;
    dailyPlan: {
        comments?: string;
        updatedAt?: Date;
    };

    planned: {
        medicines: IPlannedMedicine[];
        procedures: IPlannedProcedure[];
        foodExtras: IPlannedFoodExtra[];
        examinations: IPlannedExamination[];
    };

    caseDetailsGrid: ICaseDetailsRow[];
}

export type CaseDocument = HydratedDocument<ICase>;
