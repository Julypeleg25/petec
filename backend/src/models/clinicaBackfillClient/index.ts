import mongoose, { Model, Schema } from "mongoose";
import type {
  ClinicaBackfillClientDocument,
  IClinicaBackfillClient,
} from "./ClinicaBackfillClient.types.js";

const clinicaBackfillPetSchema = new Schema(
  {
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
    weightKg: Number,
    ageYears: Number,
    ageMonths: Number,
    insurance: {
      type: String,
      trim: true,
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

const clinicaBackfillClientSchema = new Schema<
  ClinicaBackfillClientDocument,
  Model<ClinicaBackfillClientDocument>
>(
  {
    externalPatientId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
    pets: {
      type: [clinicaBackfillPetSchema],
      default: [],
    },
    sourceDetailStatus: {
      type: String,
      enum: ["detail", "list"],
      required: true,
      default: "list",
    },
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sourceTag: {
      type: String,
      enum: ["new"],
      required: true,
      default: "new",
    },
    lastBackfilledAt: {
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

clinicaBackfillClientSchema.index({
  ownerName: 1,
  ownerPhone: 1,
});

export const ClinicaBackfillClientModel =
  mongoose.model<ClinicaBackfillClientDocument>(
    "ClinicaBackfillClient",
    clinicaBackfillClientSchema,
    "clinica_backfill_clients",
  );

export type { ClinicaBackfillClientDocument, IClinicaBackfillClient };
