import { BaseRepository, type RepositorySessionOptions } from "../base.repository.js";
import { MasterCaseModel } from "../../models/masterCase/index.js";
import type { IMasterCase } from "../../models/masterCase/index.js";
import type { Types } from "mongoose";

export class MasterCaseRepository extends BaseRepository<IMasterCase> {
    constructor() {
        super(MasterCaseModel);
    }

    async addCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<void> {
        const query = this.model.updateOne(
            { _id: masterCaseId },
            { $addToSet: { caseIds: caseId } },
        );
        if (options?.session) {
            query.session(options.session);
        }
        await query.exec();
    }

    async removeCaseId(
        masterCaseId: string | Types.ObjectId,
        caseId: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<void> {
        const query = this.model.updateOne(
            { _id: masterCaseId },
            { $pull: { caseIds: caseId } },
        );
        if (options?.session) {
            query.session(options.session);
        }
        await query.exec();
    }
}

export const masterCaseRepository = new MasterCaseRepository();
