import { BaseRepository } from "./base.repository";
import { AnesthesiaFormModel } from "@models/AnesthesiaForm";
import type { IAnesthesiaForm, AnesthesiaFormDocument } from "@models/AnesthesiaForm";

export class AnesthesiaFormRepository extends BaseRepository<IAnesthesiaForm> {
    constructor() {
        super(AnesthesiaFormModel);
    }

    async findByCaseId(caseId: string): Promise<AnesthesiaFormDocument | null> {
        return this.model.findOne({ caseId }).exec();
    }

    async upsertByCaseId(
        caseId: string,
        data: Partial<IAnesthesiaForm>,
    ): Promise<AnesthesiaFormDocument> {
        const result = await this.model.findOneAndUpdate(
            { caseId },
            { $set: { ...data, caseId } },
            { upsert: true, returnDocument: "after" },
        ).exec();
        return result;
    }
}

export const anesthesiaFormRepository = new AnesthesiaFormRepository();
