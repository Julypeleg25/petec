import { BaseRepository, type RepositorySessionOptions } from "../base.repository.js";
import { PatientDocumentModel } from "../../models/patientDocument/index.js";
import type { IPatientDocument, PatientDocumentDocument } from "../../models/patientDocument/index.js";
import type { Types } from "mongoose";

export class DocumentRepository extends BaseRepository<IPatientDocument> {
    constructor() {
        super(PatientDocumentModel);
    }

    async findByPatientId(
        patientId: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<PatientDocumentDocument[]> {
        const query = this.model
            .find({ patientId })
            .populate("patientDocumentTypeId", "name")
            .sort({ uploadedAt: -1 });
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }

    async findByCaseId(
        caseId: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<PatientDocumentDocument[]> {
        const query = this.model
            .find({ caseId })
            .populate("patientDocumentTypeId", "name")
            .sort({ uploadedAt: -1 });
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }
}

export const documentRepository = new DocumentRepository();
