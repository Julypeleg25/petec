import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IPatientDocument {
    _id: Types.ObjectId;
    patientId: Types.ObjectId;
    caseId?: Types.ObjectId;
    patientDocumentTypeId: Types.ObjectId;
    fileName: string;
    storageKey: string;
    uploadedByUserId?: Types.ObjectId;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type PatientDocumentDocument = HydratedDocument<IPatientDocument>;

const patientDocumentSchema = new Schema<IPatientDocument, Model<IPatientDocument>>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true,
        },
        caseId: {
            type: Schema.Types.ObjectId,
            ref: "Case",
            index: true,
        },
        patientDocumentTypeId: {
            type: Schema.Types.ObjectId,
            ref: "PatientDocumentType",
            required: true,
            index: true,
        },
        fileName: { type: String, required: true },
        storageKey: { type: String, required: true },
        uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, required: true, default: Date.now },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const PatientDocumentModel = mongoose.model<IPatientDocument>(
    "PatientDocument",
    patientDocumentSchema,
);
