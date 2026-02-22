import { BaseRepository } from "./base.repository";
import { PatientModel } from "@models/Patient";
import type { IPatient, PatientDocument } from "@models/Patient";

export class PatientRepository extends BaseRepository<IPatient> {
    constructor() {
        super(PatientModel);
    }

    async searchByName(name: string, limit = 20): Promise<PatientDocument[]> {
        return this.model
            .find({ name: { $regex: name, $options: "i" } })
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }

    async searchByOwnerPhone(phone: string, limit = 20): Promise<PatientDocument[]> {
        return this.model
            .find({ "owner.phone": { $regex: phone, $options: "i" } })
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }
}

export const patientRepository = new PatientRepository();
