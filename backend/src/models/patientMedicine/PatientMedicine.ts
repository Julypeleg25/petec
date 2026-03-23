import mongoose, { Schema, Model } from "mongoose";
import type { IPatientMedicine } from "./PatientMedicine.types.js";

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
        isDeleted: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

patientMedicineSchema.index({ patientId: 1, isDeleted: 1 });

export const PatientMedicineModel = mongoose.model<IPatientMedicine>(
    "PatientMedicine",
    patientMedicineSchema,
    "patient_medicines"
);

export type { IPatientMedicine, PatientMedicineDocument } from "./PatientMedicine.types.js";
