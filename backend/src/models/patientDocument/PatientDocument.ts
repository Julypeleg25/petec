import mongoose, { Schema, Model } from "mongoose";
import type { IPatientDocument } from "./PatientDocument.types.js";

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
        cloudinaryPublicId: { type: String },
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
    "patient_documents"
);

export type { IPatientDocument, PatientDocumentDocument } from "./PatientDocument.types.js";
