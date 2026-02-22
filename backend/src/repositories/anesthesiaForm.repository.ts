import { BaseRepository } from "./base.repository";
import { AnesthesiaFormModel } from "@models/AnesthesiaForm";
import type { IAnesthesiaForm, AnesthesiaFormDocument } from "@models/AnesthesiaForm";
import type { Types } from "mongoose";

export class AnesthesiaFormRepository extends BaseRepository<IAnesthesiaForm> {
    constructor() {
        super(AnesthesiaFormModel);
    }

    async findByCaseId(caseId: string | Types.ObjectId): Promise<AnesthesiaFormDocument | null> {
        return this.model.findOne({ caseId }).exec();
    }

    async upsertByCaseId(
        caseId: string | Types.ObjectId,
        data: Partial<IAnesthesiaForm>,
    ): Promise<AnesthesiaFormDocument> {
        const result = await this.model.findOneAndUpdate(
            { caseId },
            { $set: { ...data, caseId } },
            { new: true, upsert: true },
        ).exec();
        return result;
    }
}

export const anesthesiaFormRepository = new AnesthesiaFormRepository();
