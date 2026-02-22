import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IAnesthesiaForm {
    _id: Types.ObjectId;
    caseId: Types.ObjectId;
    ownerName?: string;
    name?: string;
    date?: Date;
    signature?: string;
    plannedProcedure?: string;
    priceEstimate?: string | number;
    isFastSinceMidnight?: boolean;
    isDistortionHistory?: boolean;
    isMedicationsSensitive?: boolean;
    isNeedToMarkEar?: boolean;
    isSterilization?: boolean;
    isPriceIncludesReleaseMedications?: boolean;
    generalComments?: string;
    distortionComments?: string;
    medicationsSensitiveComments?: string;
    createdByUserId?: Types.ObjectId;
    updatedByUserId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export type AnesthesiaFormDocument = HydratedDocument<IAnesthesiaForm>;

const anesthesiaFormSchema = new Schema<IAnesthesiaForm, Model<IAnesthesiaForm>>(
    {
        caseId: {
            type: Schema.Types.ObjectId,
            ref: "Case",
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
);
