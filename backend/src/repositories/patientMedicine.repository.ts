import { BaseRepository } from "./base.repository";
import { PatientMedicineModel } from "@models/PatientMedicine";
import type { IPatientMedicine, PatientMedicineDocument } from "@models/PatientMedicine";
import type { Types } from "mongoose";

export class PatientMedicineRepository extends BaseRepository<IPatientMedicine> {
    constructor() {
        super(PatientMedicineModel);
    }

    async findByPatientId(patientId: string | Types.ObjectId): Promise<PatientMedicineDocument[]> {
        return this.model
            .find({ patientId })
            .populate("medicineId", "name")
            .populate("dosageFrequencyId", "name")
            .populate("routeOfAdministrationId", "name")
            .populate("measureUnitTypeId", "name")
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByCaseId(caseId: string | Types.ObjectId): Promise<PatientMedicineDocument[]> {
        return this.model
            .find({ caseId })
            .populate("medicineId", "name")
            .sort({ createdAt: -1 })
            .exec();
    }

    async deleteAllByCaseId(caseId: string | Types.ObjectId): Promise<number> {
        return this.deleteMany({ caseId });
    }
}

export const patientMedicineRepository = new PatientMedicineRepository();
