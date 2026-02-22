import { BaseRepository } from "./base.repository";
import { MasterCaseModel } from "@models/MasterCase";
import type { IMasterCase, MasterCaseDocument } from "@models/MasterCase";
import type { Types } from "mongoose";

export class MasterCaseRepository extends BaseRepository<IMasterCase> {
    constructor() {
        super(MasterCaseModel);
    }

    async findByPatientId(patientId: string | Types.ObjectId): Promise<MasterCaseDocument[]> {
        return this.model.find({ patientId }).sort({ createdAt: -1 }).exec();
    }

    async addCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: masterCaseId },
            { $addToSet: { caseIds: caseId } },
        ).exec();
    }

    async removeCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: masterCaseId },
            { $pull: { caseIds: caseId } },
        ).exec();
    }
}

export const masterCaseRepository = new MasterCaseRepository();
