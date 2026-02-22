import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IMasterCase {
    _id: Types.ObjectId;
    patientId?: Types.ObjectId;
    caseIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export type MasterCaseDocument = HydratedDocument<IMasterCase>;

const masterCaseSchema = new Schema<IMasterCase, Model<IMasterCase>>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            index: true,
        },
        caseIds: {
            type: [{ type: Schema.Types.ObjectId, ref: "Case" }],
            default: [],
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const MasterCaseModel = mongoose.model<IMasterCase>("MasterCase", masterCaseSchema);
