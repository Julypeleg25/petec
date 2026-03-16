import { escapeRegex } from "@mappers/table/table.mappers.utils";
import { BaseRepository } from "../base.repository";
import { PatientModel } from "@models/patient";
import type { IPatient, PatientDocument } from "@models/patient";
import type { Types } from "mongoose";

const toFlexiblePhoneRegex = (value: string): RegExp => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
        return toTextRegex(value);
    }
    const pattern = digits.split("").map(escapeRegex).join("\\D*");
    return new RegExp(pattern, "i");
};

const toTextRegex = (value: string): RegExp => {
    const tokens = value
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0)
        .map((token) => escapeRegex(token));

    if (tokens.length === 0) {
        return /.*/i;
    }
    if (tokens.length === 1) {
        return new RegExp(tokens[0], "i");
    }

    const lookaheads = tokens.map((token) => `(?=.*${token})`).join("");
    return new RegExp(`${lookaheads}.*`, "i");
};

export class PatientRepository extends BaseRepository<IPatient> {
    constructor() {
        super(PatientModel);
    }

    async searchByName(name: string, limit = 20): Promise<PatientDocument[]> {
        return this.model
            .find({ name: toTextRegex(name) })
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }

    async searchByOwnerName(name: string, limit = 20): Promise<PatientDocument[]> {
        return this.model
            .find({ "owner.name": toTextRegex(name) })
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }

    async searchByOwnerPhone(phone: string, limit = 20): Promise<PatientDocument[]> {
        return this.model
            .find({ "owner.phone": toFlexiblePhoneRegex(phone) })
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }

    async searchCasePatientIds(term: string, limit = 500): Promise<Types.ObjectId[]> {
        const textRegex = toTextRegex(term);
        const phoneRegex = toFlexiblePhoneRegex(term);
        const docs = await this.model.find({
            $or: [
                { name: textRegex },
                { "owner.name": textRegex },
                { "owner.phone": phoneRegex },
            ],
        })
            .limit(limit)
            .select("_id")
            .lean()
            .exec();

        return docs
            .map((doc) => doc._id)
            .filter((id): id is Types.ObjectId => Boolean(id));
    }
}

export const patientRepository = new PatientRepository();
