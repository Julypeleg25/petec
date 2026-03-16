import type { Types } from "mongoose";
import { toObjectId } from "@utils/objectId.utils";
import type {
    ReleasePatientDTO,
    UploadDocumentDTO,
} from "@petec/shared";
import type {
    ReleaseMedicineData,
    UploadDocumentData,
} from "./patient.mappers.types";

export const mapReleaseMedicineToData = (
    medicine: ReleasePatientDTO["medicines"][number],
    patientId: Types.ObjectId,
    caseId: Types.ObjectId,
): ReleaseMedicineData => {
    const data: ReleaseMedicineData = {
        patientId,
        caseId,
        medicineId: toObjectId(medicine.medicineId),
    };

    if (medicine.dosageFrequencyId) {
        data.dosageFrequencyId = toObjectId(medicine.dosageFrequencyId);
    }

    if (medicine.routeOfAdministrationId) {
        data.routeOfAdministrationId = toObjectId(
            medicine.routeOfAdministrationId,
        );
    }

    if (medicine.measureUnitTypeId) {
        data.measureUnitTypeId = toObjectId(medicine.measureUnitTypeId);
    }

    if (
        medicine.doseAmount !== undefined &&
        medicine.doseAmount !== null &&
        medicine.doseAmount !== ""
    ) {
        data.doseAmount = medicine.doseAmount;
    }

    if (medicine.notes) {
        data.notes = medicine.notes;
    }

    if (medicine.startDate) {
        data.startDate = new Date(medicine.startDate);
    }

    if (medicine.endDate) {
        data.endDate = new Date(medicine.endDate);
    }

    return data;
};

export const mapUploadDocumentToData = (
    dto: UploadDocumentDTO,
    storageKey: string,
    cloudinaryPublicId: string,
    fileName: string,
    userId: string,
    caseObjectId: Types.ObjectId,
): UploadDocumentData => {
    const data: UploadDocumentData = {
        patientId: toObjectId(dto.patientId),
        caseId: caseObjectId,
        patientDocumentTypeId: toObjectId(dto.patientDocumentTypeId),
        storageKey,
        cloudinaryPublicId,
        fileName,
        uploadedByUserId: toObjectId(userId),
        uploadedAt: new Date(),
    };

    return data;
};
