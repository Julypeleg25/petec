import { BaseRepository } from "../base.repository.js";
import { MasterCaseModel } from "../../models/masterCase/index.js";
import type { IMasterCase } from "../../models/masterCase/index.js";
import type { Types, ClientSession, QueryOptions } from "mongoose";

export class MasterCaseRepository extends BaseRepository<IMasterCase> {
    constructor() {
        super(MasterCaseModel);
    }

    async addCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
        options?: QueryOptions<IMasterCase>,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: masterCaseId },
            { $addToSet: { caseIds: caseId } },
            options,
        ).exec();
    }

    async removeCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
        options?: QueryOptions<IMasterCase>,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: masterCaseId },
            { $pull: { caseIds: caseId } },
            options,
        ).exec();
    }
}

export const masterCaseRepository = new MasterCaseRepository();
