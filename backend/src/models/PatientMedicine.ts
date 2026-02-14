import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IPatientMedicine {
    _id: Types.ObjectId;
    patientId: Types.ObjectId;
    caseId?: Types.ObjectId;
    medicineId: Types.ObjectId;
    dosageFrequencyId?: Types.ObjectId;
    routeOfAdministrationId?: Types.ObjectId;
    measureUnitTypeId?: Types.ObjectId;
    doseAmount?: number | string;
    notes?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type PatientMedicineDocument = HydratedDocument<IPatientMedicine>;

const patientMedicineSchema = new Schema<IPatientMedicine, Model<IPatientMedicine>>(
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
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
        },
        dosageFrequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
        routeOfAdministrationId: { type: Schema.Types.ObjectId, ref: "RouteOfAdministration" },
        measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
        doseAmount: { type: Schema.Types.Mixed },
        notes: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

patientMedicineSchema.index({ patientId: 1, isActive: 1 });

export const PatientMedicineModel = mongoose.model<IPatientMedicine>(
    "PatientMedicine",
    patientMedicineSchema,
);
