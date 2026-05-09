import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";

export interface IClinicaMedicalRecord {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  patientName: string;
  ownerName: string;
  ownerPhone: string;
  recordType: string;
  rawText: string;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ClinicaMedicalRecordDocument = HydratedDocument<IClinicaMedicalRecord>;

const clinicaMedicalRecordSchema = new Schema<IClinicaMedicalRecord, Model<IClinicaMedicalRecord>>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recordType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    syncedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

clinicaMedicalRecordSchema.index({
  patientId: 1,
  recordType: 1,
});

export const ClinicaMedicalRecordModel = mongoose.model<IClinicaMedicalRecord>(
  "ClinicaMedicalRecord",
  clinicaMedicalRecordSchema,
);