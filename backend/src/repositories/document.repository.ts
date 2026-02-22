import { BaseRepository } from "./base.repository";
import { PatientDocumentModel } from "@models/PatientDocument";
import type { IPatientDocument, PatientDocumentDocument } from "@models/PatientDocument";
import type { Types } from "mongoose";

export class DocumentRepository extends BaseRepository<IPatientDocument> {
    constructor() {
        super(PatientDocumentModel);
    }

    async findByPatientId(patientId: string | Types.ObjectId): Promise<PatientDocumentDocument[]> {
        return this.model
            .find({ patientId })
            .populate("patientDocumentTypeId", "name")
            .sort({ uploadedAt: -1 })
            .exec();
    }

    async findByCaseId(caseId: string | Types.ObjectId): Promise<PatientDocumentDocument[]> {
        return this.model
            .find({ caseId })
            .populate("patientDocumentTypeId", "name")
            .sort({ uploadedAt: -1 })
            .exec();
    }
}

export const documentRepository = new DocumentRepository();
