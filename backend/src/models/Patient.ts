import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IPatientOwner {
  name: string;
  phone: string;
}

export interface IPatient {
  _id: Types.ObjectId;
  name: string;
  owner: IPatientOwner;
  photoName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientDocument = HydratedDocument<IPatient>;

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
