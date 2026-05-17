import { BaseRepository } from "../base.repository.js";
import { PatientMedicineModel } from "../../models/patientMedicine/index.js";
import type { IPatientMedicine, PatientMedicineDocument } from "../../models/patientMedicine/index.js";
import type { Types } from "mongoose";

export class PatientMedicineRepository extends BaseRepository<IPatientMedicine> {
    constructor() {
        super(PatientMedicineModel);
    }

    async findByCaseId(caseId: string | Types.ObjectId): Promise<PatientMedicineDocument[]> {
        return this.model
            .find({ caseId, isDeleted: { $ne: true } })
            .populate({
                path: "medicineId",
                select: "name rangeMin rangeMax totalDose comments measureUnitTypeId",
                populate: {
                    path: "measureUnitTypeId",
                    select: "name",
                },
            })
            .populate("dosageFrequencyId", "name")
            .populate("routeOfAdministrationId", "name")
            .populate("measureUnitTypeId", "name")
            .sort({ createdAt: -1 })
            .exec();
    }
}

export const patientMedicineRepository = new PatientMedicineRepository();
