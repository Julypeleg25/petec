import mongoose, { Schema, Model } from "mongoose";
import type {
  ClinicaClientPet,
  ClinicaClientDocument,
  IClinicaClient,
} from "./ClinicaClient.types.js";

const clinicaClientPetSchema = new Schema(
  {
    externalPatientId: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    breed: {
      type: String,
      trim: true,
    },
    species: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    weightKg: {
      type: Number,
    },
    ageYears: {
      type: Number,
    },
    ageMonths: {
      type: Number,
    },
    insurance: {
      type: String,
      trim: true,
    },
    microchipNumber: {
      type: String,
      trim: true,
    },
    neutered: {
      type: Boolean,
    },
    notes: {
      type: String,
      trim: true,
    },
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    treatingDoctor: {
      type: String,
      trim: true,
    },
    referringDoctor: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const clinicaClientSchema = new Schema<
  ClinicaClientDocument,
  Model<ClinicaClientDocument>
>(
  {
    externalPatientId: {
      type: String,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ownerPhone: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    pets: {
      type: [clinicaClientPetSchema],
      default: [],
    },
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastSyncedAt: {
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

clinicaClientSchema.index(
  { externalPatientId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

clinicaClientSchema.index({ "pets.externalPatientId": 1 }, { sparse: true });

clinicaClientSchema.index(
  { ownerName: 1, ownerPhone: 1 },
  {
    unique: true,
    name: "clinica_owner_phone_unique_nonempty_v2",
    partialFilterExpression: { ownerPhone: { $gt: "" } },
  },
);

export const ClinicaClientModel =
  mongoose.model<ClinicaClientDocument>(
    "ClinicaClient",
    clinicaClientSchema,
    "clinica_clients",
  );

export type { ClinicaClientPet, IClinicaClient, ClinicaClientDocument };
