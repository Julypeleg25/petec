import { Types } from "mongoose";
import { toObjectId, toOptionalObjectId } from "@utils/objectId.utils";
import type { NewPatientDTO, EditPatientDTO, ReleasePatientDTO, UploadDocumentDTO } from "@petec/shared";
import type { ICase } from "@models/Case";


interface PatientCreateData {
    name: string;
    owner: { name: string; phone: string };
}

interface CaseRefsData {
    animalTypeId?: Types.ObjectId;
    genderTypeId?: Types.ObjectId;
    raceTypeId?: Types.ObjectId;
    animalColorId?: Types.ObjectId;
    insuranceTypeId?: Types.ObjectId;
    foodTypeId?: Types.ObjectId;
}

interface PlannedItemData {
    medicines: Array<{ medicineId: Types.ObjectId; isActive?: boolean;[key: string]: unknown }>;
    procedures: Array<{ procedureTypeId: Types.ObjectId;[key: string]: unknown }>;
    foodExtras: Array<{ foodExtraTypeId: Types.ObjectId;[key: string]: unknown }>;
    examinations: Array<{ examinationTypeId: Types.ObjectId;[key: string]: unknown }>;
}

export const mapRefsToObjectIds = (refs: NonNullable<NewPatientDTO["refs"]>): CaseRefsData => {
    const result: CaseRefsData = {};
    if (refs.animalTypeId) result.animalTypeId = toObjectId(refs.animalTypeId);
    if (refs.genderTypeId) result.genderTypeId = toObjectId(refs.genderTypeId);
    if (refs.raceTypeId) result.raceTypeId = toObjectId(refs.raceTypeId);
    if (refs.animalColorId) result.animalColorId = toObjectId(refs.animalColorId);
    if (refs.insuranceTypeId) result.insuranceTypeId = toObjectId(refs.insuranceTypeId);
    if (refs.foodTypeId) result.foodTypeId = toObjectId(refs.foodTypeId);
    return result;
};

export const mapPlannedItems = (planned: NonNullable<NewPatientDTO["planned"]>): PlannedItemData => ({
    medicines: (planned.medicines ?? []).map((m) => ({
        ...m,
        medicineId: toObjectId(m.medicineId),
        measureUnitTypeId: toOptionalObjectId(m.measureUnitTypeId),
        dosageFrequencyId: toOptionalObjectId(m.dosageFrequencyId),
        routeOfAdministrationId: toOptionalObjectId(m.routeOfAdministrationId),
    })),
    procedures: (planned.procedures ?? []).map((p) => ({
        ...p,
        procedureTypeId: toObjectId(p.procedureTypeId),
    })),
    foodExtras: (planned.foodExtras ?? []).map((f) => ({
        ...f,
        foodExtraTypeId: toObjectId(f.foodExtraTypeId),
    })),
    examinations: (planned.examinations ?? []).map((e) => ({
        ...e,
        examinationTypeId: toObjectId(e.examinationTypeId),
    })),
});

export const mapNewPatientDtoToPatientData = (dto: NewPatientDTO): PatientCreateData => {
    const data: PatientCreateData = {
        name: dto.name,
        owner: dto.owner,
    };
    return data;
};

export const mapNewPatientDtoToCaseData = (
    dto: NewPatientDTO,
    patientId: Types.ObjectId,
    masterCaseId: Types.ObjectId,
    userId: string,
): Record<string, unknown> => {
    const caseData: Record<string, unknown> = {
        patientId,
        masterCaseId,
        createdByUserId: toObjectId(userId),
    };

    if (dto.doctorUserId) caseData.doctorUserId = toObjectId(dto.doctorUserId);
    if (dto.nurseUserId) caseData.nurseUserId = toObjectId(dto.nurseUserId);
    if (dto.admission) caseData.admission = dto.admission;
    if (dto.patientSnapshot) caseData.patientSnapshot = dto.patientSnapshot;
    if (dto.flags) caseData.flags = dto.flags;
    if (dto.dates) caseData.dates = dto.dates;
    if (dto.comments !== undefined) caseData.comments = dto.comments;
    if (dto.dailyPlan) caseData.dailyPlan = dto.dailyPlan;
    if (dto.refs) caseData.refs = mapRefsToObjectIds(dto.refs);
    if (dto.planned) caseData.planned = mapPlannedItems(dto.planned);

    return caseData;
};

export const mapEditDtoToPatientUpdate = (dto: EditPatientDTO): Record<string, unknown> => {
    const update: Record<string, unknown> = {};
    if (dto.name) update.name = dto.name;
    if (dto.owner) update.owner = dto.owner;
    if (dto.photoName !== undefined) update.photoName = dto.photoName;
    return update;
};

export const mapEditDtoToCaseUpdate = (
    dto: EditPatientDTO,
    existingCase: ICase,
): Record<string, unknown> => {
    const update: Record<string, unknown> = {};

    if (dto.admission) update.admission = { ...existingCase.admission, ...dto.admission };
    if (dto.patientSnapshot) update.patientSnapshot = { ...existingCase.patientSnapshot, ...dto.patientSnapshot };
    if (dto.flags) update.flags = { ...existingCase.flags, ...dto.flags };
    if (dto.dates) update.dates = { ...existingCase.dates, ...dto.dates };
    if (dto.doctorUserId) update.doctorUserId = toObjectId(dto.doctorUserId);
    if (dto.nurseUserId) update.nurseUserId = toObjectId(dto.nurseUserId);
    if (dto.comments !== undefined) update.comments = dto.comments;
    if (dto.dailyPlan) update.dailyPlan = { ...existingCase.dailyPlan, ...dto.dailyPlan, updatedAt: new Date() };

    if (dto.refs) {
        const updatedRefs = mapRefsToObjectIds(dto.refs);
        update.refs = { ...existingCase.refs, ...updatedRefs };
    }

    if (dto.planned) {
        update.planned = mapPlannedItems(dto.planned);
    }

    if (dto.caseDetails) {
        update.caseDetailsGrid = dto.caseDetails.flat();
    }

    return update;
};

export const mapReleaseMedicineToData = (
    med: ReleasePatientDTO["medicines"][number],
    patientId: Types.ObjectId,
    caseId: Types.ObjectId,
): Record<string, unknown> => {
    const data: Record<string, unknown> = {
        patientId,
        caseId,
        medicineId: toObjectId(med.medicineId),
    };
    if (med.dosageFrequencyId) data.dosageFrequencyId = toObjectId(med.dosageFrequencyId);
    if (med.routeOfAdministrationId) data.routeOfAdministrationId = toObjectId(med.routeOfAdministrationId);
    if (med.measureUnitTypeId) data.measureUnitTypeId = toObjectId(med.measureUnitTypeId);
    if (med.doseAmount !== undefined) data.doseAmount = med.doseAmount;
    if (med.notes !== undefined) data.notes = med.notes;
    if (med.startDate) data.startDate = new Date(med.startDate);
    if (med.endDate) data.endDate = new Date(med.endDate);
    return data;
};

export const mapUploadDocumentToData = (
    dto: UploadDocumentDTO,
    storageKey: string,
    fileName: string,
    userId: string,
): Record<string, unknown> => {
    const data: Record<string, unknown> = {
        patientId: toObjectId(dto.patientId),
        patientDocumentTypeId: toObjectId(dto.patientDocumentTypeId),
        storageKey,
        fileName,
        uploadedByUserId: toObjectId(userId),
        uploadedAt: new Date(),
    };
    if (dto.caseId) {
        data.caseId = toObjectId(dto.caseId);
    }
    return data;
};
