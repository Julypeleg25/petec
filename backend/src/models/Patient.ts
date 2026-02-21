import mongoose, { Schema, Model } from "mongoose";
import type { IPatient, IPatientOwner } from "./Patient.types";

const ownerSubSchema = new Schema<IPatientOwner>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const patientSchema = new Schema<IPatient, Model<IPatient>>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    owner: {
      type: ownerSubSchema,
      required: true,
    },
    photoName: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

patientSchema.index({ "owner.phone": 1 });

export const PatientModel = mongoose.model<IPatient>("Patient", patientSchema);

export type { IPatient, IPatientOwner, PatientDocument } from "./Patient.types";
