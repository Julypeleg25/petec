import { Types } from "mongoose";
import { toObjectId, toOptionalObjectId } from "@utils/objectId.utils";
import type { NewPatientDTO, EditPatientDTO, ReleasePatientDTO, UploadDocumentDTO } from "@petec/shared";
import type { ICase, ICaseDetailsRow } from "@models/Case";
import type {
    CaseRefsData,
    PlannedItemData,
    CaseCreateData,
    PatientCreateData,
    PatientUpdateData,
    CaseUpdateData,
    ReleaseMedicineData,
    UploadDocumentData,
} from "@mappers/patient/patient.mappers.types";

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
        doseAmount: typeof m.doseAmount === "string" ? Number(m.doseAmount) : m.doseAmount,
        measureUnitTypeId: toOptionalObjectId(m.measureUnitTypeId),
        dosageFrequencyId: toOptionalObjectId(m.dosageFrequencyId),
        routeOfAdministrationId: toOptionalObjectId(m.routeOfAdministrationId),
        startDate: m.startDate ? new Date(m.startDate) : undefined,
        endDate: m.endDate ? new Date(m.endDate) : undefined,
        isDeleted: m.isDeleted ?? false,
    })),
    procedures: (planned.procedures ?? []).map((p) => ({
        ...p,
        procedureTypeId: toObjectId(p.procedureTypeId),
        scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : undefined,
        status: p.status ?? "planned",
    })),
    foodExtras: (planned.foodExtras ?? []).map((f) => ({
        foodExtraTypeId: toObjectId(f.foodExtraTypeId),
        amount: f.amount,
        measureUnitTypeId: toOptionalObjectId(f.measureUnitTypeId),
        frequencyId: toOptionalObjectId(f.frequencyId),
        notes: f.notes,
    })),
    examinations: (planned.examinations ?? []).map((e) => ({
        ...e,
        examinationTypeId: toObjectId(e.examinationTypeId),
        scheduledFor: e.scheduledFor ? new Date(e.scheduledFor) : undefined,
    })),
});

export const mapNewPatientDtoToPatientData = (dto: NewPatientDTO): PatientCreateData => {
    const data: PatientCreateData = {
        serialId: dto.caseId,
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
): CaseCreateData => {
    const caseData: CaseCreateData = {
        patientId,
        masterCaseId,
        serialId: dto.caseId,
        createdByUserId: toObjectId(userId),
    };
    if (dto.doctorUserId) caseData.doctorUserId = toObjectId(dto.doctorUserId);
    if (dto.nurseUserId) caseData.nurseUserId = toObjectId(dto.nurseUserId);
    if (dto.admission) caseData.admission = dto.admission;
    if (dto.patientSnapshot) caseData.patientSnapshot = dto.patientSnapshot;
    if (dto.flags) caseData.flags = dto.flags;
    if (dto.dates) caseData.dates = dto.dates;
    if (dto.comments) caseData.comments = dto.comments;
    if (dto.dailyPlan) caseData.dailyPlan = dto.dailyPlan;
    if (dto.refs) caseData.refs = mapRefsToObjectIds(dto.refs);
    if (dto.planned) caseData.planned = mapPlannedItems(dto.planned);
    return caseData;
};

export const mapEditDtoToPatientUpdate = (dto: EditPatientDTO): PatientUpdateData => {
    const update: PatientUpdateData = {};
    if (dto.name) update.name = dto.name;
    if (dto.owner) update.owner = dto.owner;
    return update;
};

export const mapEditDtoToCaseUpdate = (
    dto: EditPatientDTO,
    existingCase: ICase,
): CaseUpdateData => {
    const update: CaseUpdateData = {};
    if (dto.admission) update.admission = { ...existingCase.admission, ...dto.admission };
    if (dto.patientSnapshot) update.patientSnapshot = { ...existingCase.patientSnapshot, ...dto.patientSnapshot };
    if (dto.flags) update.flags = { ...existingCase.flags, ...dto.flags };
    if (dto.dates) update.dates = { ...existingCase.dates, ...dto.dates };
    if (dto.doctorUserId) update.doctorUserId = toObjectId(dto.doctorUserId);
    if (dto.nurseUserId) update.nurseUserId = toObjectId(dto.nurseUserId);
    if (dto.comments) update.comments = dto.comments;
    if (dto.dailyPlan) update.dailyPlan = { ...existingCase.dailyPlan, ...dto.dailyPlan, updatedAt: new Date() };
    if (dto.refs) {
        const updatedRefs = mapRefsToObjectIds(dto.refs);
        update.refs = { ...existingCase.refs, ...updatedRefs };
    }
    if (dto.planned) update.planned = mapPlannedItems(dto.planned);
    return update;
};

export const mapGridDtoToRows = (grid: NonNullable<EditPatientDTO["caseDetails"]>): Partial<ICaseDetailsRow>[] =>
    grid.flat().map((row) => ({
        date: row.date,
        time: row.time,
        index: row.index,
        temperature: row.temperature,
        temperatureIsRequired: row.temperatureIsRequired,
        temperatureIsEditable: row.temperatureIsEditable,
        pulse: row.pulse,
        pulseIsRequired: row.pulseIsRequired,
        pulseIsEditable: row.pulseIsEditable,
        respiration: row.respiration,
        respirationIsRequired: row.respirationIsRequired,
        respirationIsEditable: row.respirationIsEditable,
        urineTypeId: toOptionalObjectId(row.urineTypeId),
        urineComments: row.urineComments,
        urineIsRequired: row.urineIsRequired,
        urineIsEditable: row.urineIsEditable,
        fecesTypeId: toOptionalObjectId(row.fecesTypeId),
        fecesComments: row.fecesComments,
        fecesIsRequired: row.fecesIsRequired,
        fecesIsEditable: row.fecesIsEditable,
        isBoxClean: row.isBoxClean,
        isBoxCleanIsRequired: row.isBoxCleanIsRequired,
        isBoxCleanIsEditable: row.isBoxCleanIsEditable,
        isRelease: row.isRelease,
        isReleaseIsRequired: row.isReleaseIsRequired,
        isReleaseIsEditable: row.isReleaseIsEditable,
        isTravel: row.isTravel,
        isTravelIsRequired: row.isTravelIsRequired,
        isTravelIsEditable: row.isTravelIsEditable,
        weigh: row.weigh,
        weighIsRequired: row.weighIsRequired,
        weighIsEditable: row.weighIsEditable,
        isPuke: row.isPuke,
        pukeComments: row.pukeComments,
        pukeIsRequired: row.pukeIsRequired,
        pukeIsEditable: row.pukeIsEditable,
        rowComments: row.rowComments,
        rowCommentsIsRequired: row.rowCommentsIsRequired,
        rowCommentsIsEditable: row.rowCommentsIsEditable,
        ownerUpdate: row.ownerUpdate,
        ownerUpdateIsRequired: row.ownerUpdateIsRequired,
        ownerUpdateIsEditable: row.ownerUpdateIsEditable,
        foodGiven: row.foodGiven,
        waterGiven: row.waterGiven,
        fluids: row.fluids.map((f) => ({
            medicineId: toObjectId(f.medicineId),
            name: f.name,
            dosageText: f.dosageText,
            doseAmount: typeof f.doseAmount === "string" ? Number(f.doseAmount) : f.doseAmount,
            measureUnitTypeId: toOptionalObjectId(f.measureUnitTypeId),
            isGiven: f.isGiven,
            isRequired: f.isRequired,
            isEditable: f.isEditable,
            comment: f.comment,
        })),
        medicines: row.medicines.map((m) => ({
            medicineId: toObjectId(m.medicineId),
            name: m.name,
            dosageText: m.dosageText,
            doseAmount: typeof m.doseAmount === "string" ? Number(m.doseAmount) : m.doseAmount,
            measureUnitTypeId: toOptionalObjectId(m.measureUnitTypeId),
            isGiven: m.isGiven,
            isRequired: m.isRequired,
            isEditable: m.isEditable,
            comment: m.comment,
        })),
        procedures: row.procedures.map((p) => ({
            typeId: toObjectId(p.typeId),
            name: p.name,
            isGiven: p.isGiven,
            isRequired: p.isRequired,
            isEditable: p.isEditable,
            comment: p.comment,
        })),
        examinations: row.examinations.map((e) => ({
            typeId: toObjectId(e.typeId),
            name: e.name,
            value: e.value ?? null,
            isRequired: e.isRequired,
            isEditable: e.isEditable,
            comment: e.comment,
        })),
        foodExtras: row.foodExtras.map((fe) => ({
            typeId: toObjectId(fe.typeId),
            name: fe.name,
            isGiven: fe.isGiven,
            isRequired: fe.isRequired,
            isEditable: fe.isEditable,
            comment: fe.comment,
        })),
    }));

export const mapReleaseMedicineToData = (
    med: ReleasePatientDTO["medicines"][number],
    patientId: Types.ObjectId,
    caseId: Types.ObjectId,
): ReleaseMedicineData => {
    const data: ReleaseMedicineData = {
        patientId,
        caseId,
        medicineId: toObjectId(med.medicineId),
    };
    if (med.dosageFrequencyId) data.dosageFrequencyId = toObjectId(med.dosageFrequencyId);
    if (med.routeOfAdministrationId) data.routeOfAdministrationId = toObjectId(med.routeOfAdministrationId);
    if (med.measureUnitTypeId) data.measureUnitTypeId = toObjectId(med.measureUnitTypeId);
    if (med.doseAmount) data.doseAmount = med.doseAmount;
    if (med.notes) data.notes = med.notes;
    if (med.startDate) data.startDate = new Date(med.startDate);
    if (med.endDate) data.endDate = new Date(med.endDate);
    return data;
};

export const mapUploadDocumentToData = (
    dto: UploadDocumentDTO,
    storageKey: string,
    fileName: string,
    userId: string,
    caseObjectId?: Types.ObjectId,
): UploadDocumentData => {
    const data: UploadDocumentData = {
        patientId: toObjectId(dto.patientId),
        patientDocumentTypeId: toObjectId(dto.patientDocumentTypeId),
        storageKey,
        fileName,
        uploadedByUserId: toObjectId(userId),
        uploadedAt: new Date(),
    };
    if (caseObjectId) data.caseId = caseObjectId;
    return data;
};
