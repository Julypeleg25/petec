import { Schema, Model } from "mongoose";
import { CASE_SERIAL_ID_REGEX } from "@petec/shared";
import { ICase } from "./Case.types";
import {
    caseDetailsRowSchema,
} from "./CaseDetails.schema";

export const caseSchema = new Schema<ICase, Model<ICase>>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true,
        },
        serialId: {
            type: String,
            required: true,
            trim: true,
            match: CASE_SERIAL_ID_REGEX,
        },
        masterCaseId: {
            type: Schema.Types.ObjectId,
            ref: "MasterCase",
            index: true,
        },

        createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
        doctorUserId: { type: Schema.Types.ObjectId, ref: "User" },
        nurseUserId: { type: Schema.Types.ObjectId, ref: "User" },
        releasedByUserId: { type: Schema.Types.ObjectId, ref: "User" },

        releaseDate: { type: Date },
        isArchived: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },

        admission: {
            type: new Schema(
                {
                    hospitalizationReason: { type: String },
                    referringDoctor: { type: String },
                    allergicComments: { type: String, default: null },
                    bloodTestLink: { type: String, default: null },
                },
                { _id: false },
            ),
            default: {},
        },

        patientSnapshot: {
            type: new Schema(
                {
                    ageYears: { type: Number, min: 0 },
                    ageMonths: { type: Number, min: 0 },
                    weightKg: { type: Number, min: 0 },
                },
                { _id: false },
            ),
            default: {},
        },

        flags: {
            type: new Schema(
                {
                    isAllergic: { type: Boolean },
                    isEscapePotential: { type: Boolean },
                    isNPO: { type: Boolean },
                    isRiskAnesthesia: { type: Boolean },
                    isHeartMurmur: { type: Boolean },
                    isAMB: { type: Boolean },
                    isAggressive: { type: Boolean },
                    isConvenia: { type: Boolean },
                    isCerenia: { type: Boolean },
                    isProcedure: { type: Boolean },
                },
                { _id: false },
            ),
            default: {},
        },

        dates: {
            type: new Schema(
                {
                    catheterDate: { type: Date },
                    procedureDate: { type: Date },
                    nextInspectionDate: { type: Date },
                    stitchesRemovalDate: { type: Date },
                },
                { _id: false },
            ),
            default: {},
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
            default: {},
        },

        comments: { type: String },
        dailyPlan: {
            type: new Schema(
                {
                    comments: { type: String },
                    updatedAt: { type: Date },
                },
                { _id: false },
            ),
            default: {},
        },
        caseDetailsGrid: { type: [caseDetailsRowSchema], default: [] },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

caseSchema.index({ patientId: 1, isDeleted: 1 });
caseSchema.index({ isArchived: 1, releaseDate: -1 });
caseSchema.index({ serialId: 1 }, { unique: true });
caseSchema.index({ createdAt: 1 });
caseSchema.index({ "caseDetailsGrid.dateTime": -1 });
