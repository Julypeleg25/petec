import { Schema } from "mongoose";
import {
    ICaseDetailsMedicineObj,
    ICaseDetailsOptionsObj,
    ICaseDetailsExamObj,
    ICaseDetailsRow,
    IPlannedMedicine,
    IPlannedProcedure,
    IPlannedFoodExtra,
    IPlannedExamination,
} from "./Case.types";

export const caseDetailsMedicineObjSchema = new Schema<ICaseDetailsMedicineObj>(
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
        comment: { type: String },
    },
    { _id: true },
);

export const caseDetailsOptionsObjSchema = new Schema<ICaseDetailsOptionsObj>(
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

export const caseDetailsExamObjSchema = new Schema<ICaseDetailsExamObj>(
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

export const caseDetailsRowSchema = new Schema<ICaseDetailsRow>(
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
        foodAndWaterIsEditable: { type: Boolean, default: true },

        fluids: { type: [caseDetailsMedicineObjSchema], default: [] },
        medicines: { type: [caseDetailsMedicineObjSchema], default: [] },
        procedures: { type: [caseDetailsOptionsObjSchema], default: [] },
        examinations: { type: [caseDetailsExamObjSchema], default: [] },
        foodExtras: { type: [caseDetailsOptionsObjSchema], default: [] },
    },
    { _id: true },
);

export const plannedMedicineSchema = new Schema<IPlannedMedicine>(
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

export const plannedProcedureSchema = new Schema<IPlannedProcedure>(
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

export const plannedFoodExtraSchema = new Schema<IPlannedFoodExtra>(
    {
        foodExtraTypeId: { type: Schema.Types.ObjectId, ref: "FoodExtraType", required: true },
        amount: { type: Number },
        measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
        frequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
        notes: { type: String },
    },
    { _id: false },
);

export const plannedExaminationSchema = new Schema<IPlannedExamination>(
    {
        examinationTypeId: { type: Schema.Types.ObjectId, ref: "ExaminationType", required: true },
        scheduledFor: { type: Date },
        notes: { type: String },
        status: { type: String },
    },
    { _id: false },
);
