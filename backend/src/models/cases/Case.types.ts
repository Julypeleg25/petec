import { HydratedDocument, Types } from "mongoose";

type NamedLookupReference = {
    _id: Types.ObjectId;
    name?: string;
};

type LookupReference = Types.ObjectId | NamedLookupReference;

export interface ICaseDetailsMedicineObj {
    _id?: Types.ObjectId;
    medicineId: LookupReference;
    name?: string;
    dosageText?: string;
    doseAmount?: number | string;
    measureUnitTypeId?: LookupReference;
    dosageFrequencyId?: LookupReference;
    routeOfAdministrationId?: LookupReference;
    isGiven?: boolean;
    isRequired: boolean;
    isEditable: boolean;
    comment?: string;
}

export interface ICaseDetailsOptionsObj {
    _id?: Types.ObjectId;
    typeId: Types.ObjectId;
    name?: string;
    isGiven?: boolean;
    isRequired: boolean;
    isEditable: boolean;
    comment?: string;
}

export interface ICaseDetailsExamObj {
    _id?: Types.ObjectId;
    typeId: Types.ObjectId;
    name?: string;
    value?: string | null;
    isRequired: boolean;
    isEditable: boolean;
    comment?: string;
}

export interface ICaseDetailsRow {
    _id?: Types.ObjectId;
    date: string;
    time: string;
    dateTime: Date;
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

    isTravel?: boolean;
    isTravelIsRequired?: boolean;
    isTravelIsEditable?: boolean;

    weigh?: number;
    weighIsRequired?: boolean;
    weighIsEditable?: boolean;

    isPuke?: boolean;
    pukeComments?: string;
    pukeIsRequired?: boolean;
    pukeIsEditable?: boolean;

    rowComments?: string;
    rowCommentsIsRequired?: boolean;
    rowCommentsIsEditable?: boolean;

    ownerUpdate?: string;
    ownerUpdateIsRequired?: boolean;
    ownerUpdateIsEditable?: boolean;

    foodGiven?: boolean;
    waterGiven?: boolean;

    foodAndWater?: string | null;
    foodAndWaterIsRequired?: boolean;
    foodAndWaterIsEditable?: boolean;

    fluids: ICaseDetailsMedicineObj[];
    medicines: ICaseDetailsMedicineObj[];
    procedures: ICaseDetailsOptionsObj[];
    examinations: ICaseDetailsExamObj[];
    foodExtras: ICaseDetailsOptionsObj[];
}

export interface IPlannedMedicine {
    medicineId: Types.ObjectId;
    dosageText?: string;
    doseAmount?: number | string;
    measureUnitTypeId?: Types.ObjectId;
    dosageFrequencyId?: Types.ObjectId;
    routeOfAdministrationId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    isDeleted: boolean;
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
    serialId: string;
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
