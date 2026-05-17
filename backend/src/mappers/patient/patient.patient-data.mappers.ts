import type {
    EditPatientDTO,
    NewPatientDTO,
} from "@petec/shared";
import type {
    PatientCreateData,
    PatientUpdateData,
} from "./patient.mappers.types.js";

export const mapNewPatientDtoToPatientData = (
    dto: NewPatientDTO,
): PatientCreateData => ({
    serialId: dto.caseId,
    name: dto.name,
    owner: dto.owner,
});

export const mapEditDtoToPatientUpdate = (
    dto: EditPatientDTO,
): PatientUpdateData => {
    const update: PatientUpdateData = {};

    if (dto.name) {
        update.name = dto.name;
    }

    if (dto.owner) {
        update.owner = dto.owner;
    }

    return update;
};
