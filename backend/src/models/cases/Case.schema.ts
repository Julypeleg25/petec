import { Schema, Model } from "mongoose";
import { CASE_SERIAL_ID_REGEX } from "@petec/shared";
import {
    ICase,
    ICaseDetailsMedicineObj,
    ICaseDetailsOptionsObj,
    ICaseDetailsExamObj,
    ICaseDetailsRow,
    IPlannedMedicine,
    IPlannedProcedure,
    IPlannedFoodExtra,
    IPlannedExamination,
} from "./Case.types";

const caseDetailsMedicineObjSchema = new Schema<ICaseDetailsMedicineObj>(
    {
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        name: { type: String },
        dosageText: { type: String },
        doseAmount: { type: Schema.Types.Mixed },
        measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
        dosageFrequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
        routeOfAdministrationId: { type: Schema.Types.ObjectId, ref: "RouteOfAdministration" },
        isGiven: { type: Boolean },
        isRequired: { type: Boolean, required: true },
        isEditable: { type: Boolean, required: true },
        notes: { type: String },
        comment: { type: String },
    },
    { _id: true },
);

const caseDetailsOptionsObjSchema = new Schema<ICaseDetailsOptionsObj>(
    {
        typeId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String },
        isGiven: { type: Boolean },
        isRequired: { type: Boolean, required: true },
        isEditable: { type: Boolean, required: true },
        comment: { type: String },
    },
    { _id: true },
);

const caseDetailsExamObjSchema = new Schema<ICaseDetailsExamObj>(
    {
        typeId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String },
        value: { type: String, default: null },
        isRequired: { type: Boolean, required: true },
        isEditable: { type: Boolean, required: true },
        comment: { type: String },
    },
    { _id: true },
);

const caseDetailsRowSchema = new Schema<ICaseDetailsRow>(
    {
        date: { type: String, required: true },
        time: { type: String, required: true },
        dateTime: { type: Date, required: true },
        index: { type: Number, required: true },

        temperature: { type: Number },
        temperatureIsRequired: { type: Boolean },
        temperatureIsEditable: { type: Boolean },

        pulse: { type: Number },
        pulseIsRequired: { type: Boolean },
        pulseIsEditable: { type: Boolean },

        respiration: { type: Number },
        respirationIsRequired: { type: Boolean },
        respirationIsEditable: { type: Boolean },

        urineTypeId: { type: Schema.Types.ObjectId, ref: "UrineType" },
        urineComments: { type: String },
        urineIsRequired: { type: Boolean },
        urineIsEditable: { type: Boolean },

        fecesTypeId: { type: Schema.Types.ObjectId, ref: "FecesType" },
        fecesComments: { type: String },
        fecesIsRequired: { type: Boolean },
        fecesIsEditable: { type: Boolean },

        isBoxClean: { type: Boolean },
        isBoxCleanIsRequired: { type: Boolean },
        isBoxCleanIsEditable: { type: Boolean },

        isRelease: { type: Boolean },
        isReleaseIsRequired: { type: Boolean },
        isReleaseIsEditable: { type: Boolean },

        isTravel: { type: Boolean },
        isTravelIsRequired: { type: Boolean },
        isTravelIsEditable: { type: Boolean },

        weigh: { type: Number },
        weighIsRequired: { type: Boolean },
        weighIsEditable: { type: Boolean },

        isPuke: { type: Boolean },
        pukeComments: { type: String },
        pukeIsRequired: { type: Boolean },
        pukeIsEditable: { type: Boolean },

        rowComments: { type: String },
        rowCommentsIsRequired: { type: Boolean },
        rowCommentsIsEditable: { type: Boolean },

        ownerUpdate: { type: String },
        ownerUpdateIsRequired: { type: Boolean },
        ownerUpdateIsEditable: { type: Boolean },

        foodGiven: { type: Boolean },
        waterGiven: { type: Boolean },

        foodAndWater: { type: String, default: null },
        foodAndWaterIsRequired: { type: Boolean, default: false },
        foodAndWaterIsEditable: { type: Boolean, default: false },

        fluids: { type: [caseDetailsMedicineObjSchema], default: [] },
        medicines: { type: [caseDetailsMedicineObjSchema], default: [] },
        procedures: { type: [caseDetailsOptionsObjSchema], default: [] },
        examinations: { type: [caseDetailsExamObjSchema], default: [] },
        foodExtras: { type: [caseDetailsOptionsObjSchema], default: [] },
    },
    { _id: true },
);

const plannedMedicineSchema = new Schema<IPlannedMedicine>(
    {
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        dosageText: { type: String },
        doseAmount: { type: Schema.Types.Mixed },
        measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
        dosageFrequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
        routeOfAdministrationId: { type: Schema.Types.ObjectId, ref: "RouteOfAdministration" },
        startDate: { type: Date },
        endDate: { type: Date },
        isDeleted: { type: Boolean, default: false },
        notes: { type: String },
    },
    { _id: false },
);

const plannedProcedureSchema = new Schema<IPlannedProcedure>(
    {
        procedureTypeId: { type: Schema.Types.ObjectId, ref: "ProcedureType", required: true },
        plannedProcedureText: { type: String },
        scheduledFor: { type: Date },
        priority: { type: String },
        status: { type: String, default: "pending" },
        notes: { type: String },
    },
    { _id: false },
);

const plannedFoodExtraSchema = new Schema<IPlannedFoodExtra>(
    {
        foodExtraTypeId: { type: Schema.Types.ObjectId, ref: "FoodExtraType", required: true },
        amount: { type: Number },
        measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
        frequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
        notes: { type: String },
    },
    { _id: false },
);

const plannedExaminationSchema = new Schema<IPlannedExamination>(
    {
        examinationTypeId: { type: Schema.Types.ObjectId, ref: "ExaminationType", required: true },
        scheduledFor: { type: Date },
        notes: { type: String },
        status: { type: String },
    },
    { _id: false },
);

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

        planned: {
            type: new Schema(
                {
                    medicines: { type: [plannedMedicineSchema], default: [] },
                    procedures: { type: [plannedProcedureSchema], default: [] },
                    foodExtras: { type: [plannedFoodExtraSchema], default: [] },
                    examinations: { type: [plannedExaminationSchema], default: [] },
                },
                { _id: false },
            ),
            default: { medicines: [], procedures: [], foodExtras: [], examinations: [] },
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
