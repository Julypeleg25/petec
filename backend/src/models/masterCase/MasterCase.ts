import mongoose, { Schema, Model } from "mongoose";
import type { IMasterCase } from "./MasterCase.types.js";

const masterCaseSchema = new Schema<IMasterCase, Model<IMasterCase>>(
    {
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

export const MasterCaseModel = mongoose.model<IMasterCase>("MasterCase", masterCaseSchema, "master_cases");

export type { IMasterCase, MasterCaseDocument } from "./MasterCase.types.js";
