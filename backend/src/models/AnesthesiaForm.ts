import mongoose, { Schema, Model } from "mongoose";
import type { IAnesthesiaForm } from "./AnesthesiaForm.types";

const anesthesiaFormSchema = new Schema<IAnesthesiaForm, Model<IAnesthesiaForm>>(
    {
        caseId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        ownerName: { type: String },
        name: { type: String },
        date: { type: Date },
        signature: { type: String },
        plannedProcedure: { type: String },
        priceEstimate: { type: Schema.Types.Mixed },
        isFastSinceMidnight: { type: Boolean },
        isDistortionHistory: { type: Boolean },
        isMedicationsSensitive: { type: Boolean },
        isNeedToMarkEar: { type: Boolean },
        isSterilization: { type: Boolean },
        isPriceIncludesReleaseMedications: { type: Boolean },
        generalComments: { type: String },
        distortionComments: { type: String },
        medicationsSensitiveComments: { type: String },
        createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
        updatedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const AnesthesiaFormModel = mongoose.model<IAnesthesiaForm>(
    "AnesthesiaForm",
    anesthesiaFormSchema,
    "anesthesiaForms"
);

export type { IAnesthesiaForm, AnesthesiaFormDocument } from "./AnesthesiaForm.types";
