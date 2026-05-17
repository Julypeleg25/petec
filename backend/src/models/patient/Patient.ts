import mongoose, { Schema, Model } from "mongoose";
import { CASE_SERIAL_ID_REGEX } from "@petec/shared";
import type { IPatient, IPatientOwner } from "./Patient.types.js";

const ownerSubSchema = new Schema<IPatientOwner>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const patientSchema = new Schema<IPatient, Model<IPatient>>(
  {
    serialId: {
      type: String,
      required: true,
      trim: true,
      match: CASE_SERIAL_ID_REGEX,
    },
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
    photoPublicId: {
      type: String,
    },
    refs: {
      type: new Schema(
        {
          animalTypeId: { type: Schema.Types.ObjectId, ref: "AnimalType" },
          genderTypeId: { type: Schema.Types.ObjectId, ref: "GenderType" },
          raceTypeId: { type: Schema.Types.ObjectId, ref: "RaceType" },
          animalColorId: { type: Schema.Types.ObjectId, ref: "AnimalColor" },
          insuranceTypeId: { type: Schema.Types.ObjectId, ref: "InsuranceType" },
          foodTypeId: { type: Schema.Types.ObjectId, ref: "FoodType" },
        },
        { _id: false },
      ),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

patientSchema.index({ "owner.phone": 1 });
patientSchema.index({ serialId: 1 }, { sparse: true });

export const PatientModel = mongoose.model<IPatient>("Patient", patientSchema, "patients");

export type { IPatient, IPatientOwner, PatientDocument } from "./Patient.types.js";
