import type { ICase, ICaseDetailsRow, ICaseDetailsMedicineObj, ICaseDetailsOptionsObj, ICaseDetailsExamObj } from "../../models/case/index.js";
import type { PopulatedPatient, PopulatedNameRef } from "../../types/patient.types.js";

export type PopulatedMedicineObj = Omit<ICaseDetailsMedicineObj, "medicineId" | "measureUnitTypeId" | "dosageFrequencyId" | "routeOfAdministrationId"> & {
    medicineId: PopulatedNameRef;
    measureUnitTypeId?: PopulatedNameRef;
    dosageFrequencyId?: PopulatedNameRef;
    routeOfAdministrationId?: PopulatedNameRef;
};

export type PopulatedOptionsObj = Omit<ICaseDetailsOptionsObj, "typeId"> & {
    typeId: PopulatedNameRef;
};

export type PopulatedExamObj = Omit<ICaseDetailsExamObj, "typeId"> & {
    typeId: PopulatedNameRef;
};

export type PopulatedCaseDetailsRow = Omit<ICaseDetailsRow, "fluids" | "medicines" | "procedures" | "examinations" | "foodExtras" | "urineTypeId" | "fecesTypeId"> & {
    fluids: PopulatedMedicineObj[];
    medicines: PopulatedMedicineObj[];
    procedures: PopulatedOptionsObj[];
    examinations: PopulatedExamObj[];
    foodExtras: PopulatedOptionsObj[];
    urineTypeId?: PopulatedNameRef;
    fecesTypeId?: PopulatedNameRef;
};

export type PopulatedCase = Omit<ICase, "patientId" | "refs" | "doctorUserId" | "caseDetailsGrid"> & {
    patientId: PopulatedPatient;
    refs: {
        insuranceTypeId?: PopulatedNameRef;
        genderTypeId?: PopulatedNameRef;
        animalTypeId?: PopulatedNameRef;
        animalColorId?: PopulatedNameRef;
        raceTypeId?: PopulatedNameRef;
        foodTypeId?: PopulatedNameRef;
    };
    doctorUserId?: { email?: string; firstName?: string; lastName?: string };
    caseDetailsGrid: PopulatedCaseDetailsRow[];
};

export interface CaseExportTemplateData extends Record<string, string | number | boolean | undefined | null> {
    date: string;
    ownerName: string;
    ownerPhoneNumber: string;
    insurance: string;
    referringDoctor: string;
    caseId: string;
    animalName: string;
    weight: string;
    gender: string;
    type: string;
    color: string;
    age: string;
    breed: string;
    hospitalizationReason: string;
    allergicComments: string;
    foodType: string;
    catheterDate: string;
    procedureDate: string;
    isAMB?: boolean;
    isHeartMurmur?: boolean;
    isRiskAnesthesia?: boolean;
    isNPO?: boolean;
    isEscapePotential?: boolean;
    isAggressive?: boolean;
    isCerenia?: boolean;
    isConvenia?: boolean;
    isAllergic?: boolean;
    releaseDate: string;
    nextInspectionDate: string;
    stitchesRemovalDate: string;
    doctor: string;
    fluids: string;
    medicines: string;
    examinations: string;
    procedures: string;
    foodExtras: string;
    releaseMedicines: string;
}
