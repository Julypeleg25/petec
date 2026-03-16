import mongoose, { Schema, Model } from "mongoose";
import {
  MEDICINE_CATEGORY_TYPE_VALUES,
  SYSTEM_TYPE_NAMES,
  type SystemTypeName,
} from "@petec/shared";
import type {
  IAnimalVitals,
  IBaseLookup,
  ILookupWithAnimalType,
  IMedicine,
  IMedicineCategory,
} from "./Lookups.types";

const createLookupSchema = (): Schema<IBaseLookup> => {
  const schema = new Schema<IBaseLookup>(
    {
      serialId: { type: String, trim: true },
      name: { type: String, required: true, trim: true },
      isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, versionKey: false },
  );
  schema.index({ serialId: 1 }, { unique: true, sparse: true });
  return schema;
};

const createLookupWithAnimalTypeSchema = (): Schema<ILookupWithAnimalType> => {
  const schema = new Schema<ILookupWithAnimalType>(
    {
      serialId: { type: String, trim: true },
      name: { type: String, required: true, trim: true },
      isDeleted: { type: Boolean, default: false, index: true },
      animalTypeId: {
        type: Schema.Types.ObjectId,
        ref: "AnimalType",
        required: true,
        index: true,
      },
    },
    { timestamps: true, versionKey: false },
  );
  schema.index({ serialId: 1 }, { unique: true, sparse: true });
  return schema;
};

const medicineSchema = new Schema<IMedicine>(
  {
    serialId: { type: String, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MedicineCategory", index: true },
    measureUnitTypeId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
    dosageFrequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
    routeOfAdministrationId: { type: Schema.Types.ObjectId, ref: "RouteOfAdministration" },
    rangeMin: { type: Number },
    rangeMax: { type: Number },
    totalDose: { type: Number },
    comments: { type: String },
  },
  { timestamps: true, versionKey: false },
);
medicineSchema.index({ serialId: 1 }, { unique: true, sparse: true });

const medicineCategorySchema = new Schema<IMedicineCategory>(
  {
    serialId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: MEDICINE_CATEGORY_TYPE_VALUES,
      required: true,
      index: true,
      unique: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
);
medicineCategorySchema.index({ serialId: 1 }, { unique: true, sparse: true });

export const RaceTypeModel = mongoose.model<ILookupWithAnimalType>("RaceType", createLookupWithAnimalTypeSchema(), SYSTEM_TYPE_NAMES.RACE_TYPES);
export const AnimalColorModel = mongoose.model<IBaseLookup>("AnimalColor", createLookupSchema(), SYSTEM_TYPE_NAMES.ANIMAL_COLORS);

const animalVitalsSchema = new Schema<IAnimalVitals>(
  {
    serialId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    animalTypeId: {
      type: Schema.Types.ObjectId,
      ref: "AnimalType",
      required: true,
      index: true,
    },
    vitalsType: { type: String, trim: true },
    rangeMin: { type: Number },
    rangeMax: { type: Number },
  },
  { timestamps: true, versionKey: false },
);
animalVitalsSchema.index({ serialId: 1 }, { unique: true, sparse: true });

export const AnimalTypeModel = mongoose.model<IBaseLookup>("AnimalType", createLookupSchema(), SYSTEM_TYPE_NAMES.ANIMAL_TYPES);
export const AnimalVitalsModel = mongoose.model<IAnimalVitals>("AnimalVitals", animalVitalsSchema, SYSTEM_TYPE_NAMES.ANIMAL_VITALS);
export const GenderTypeModel = mongoose.model<IBaseLookup>("GenderType", createLookupSchema(), SYSTEM_TYPE_NAMES.GENDER_TYPES);
export const InsuranceTypeModel = mongoose.model<IBaseLookup>("InsuranceType", createLookupSchema(), SYSTEM_TYPE_NAMES.INSURANCE_TYPES);
export const FoodTypeModel = mongoose.model<IBaseLookup>("FoodType", createLookupSchema(), SYSTEM_TYPE_NAMES.FOOD_TYPES);
export const FoodExtraTypeModel = mongoose.model<IBaseLookup>("FoodExtraType", createLookupSchema(), SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES);
export const ExaminationTypeModel = mongoose.model<IBaseLookup>("ExaminationType", createLookupSchema(), SYSTEM_TYPE_NAMES.EXAMINATION_TYPES);
export const FecesTypeModel = mongoose.model<IBaseLookup>("FecesType", createLookupSchema(), SYSTEM_TYPE_NAMES.FECES_TYPES);
export const UrineTypeModel = mongoose.model<IBaseLookup>("UrineType", createLookupSchema(), SYSTEM_TYPE_NAMES.URINE_TYPES);
export const DosageFrequencyModel = mongoose.model<IBaseLookup>("DosageFrequency", createLookupSchema(), SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES);
export const MeasureUnitTypeModel = mongoose.model<IBaseLookup>("MeasureUnitType", createLookupSchema(), SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES);
export const ProcedureTypeModel = mongoose.model<IBaseLookup>("ProcedureType", createLookupSchema(), SYSTEM_TYPE_NAMES.PROCEDURE_TYPES);
export const MedicineModel = mongoose.model<IMedicine>("Medicine", medicineSchema, SYSTEM_TYPE_NAMES.MEDICINES);
export const MedicineCategoryModel = mongoose.model<IMedicineCategory>("MedicineCategory", medicineCategorySchema, SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES);
export const RouteOfAdministrationModel = mongoose.model<IBaseLookup>("RouteOfAdministration", createLookupSchema(), SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION);
export const AnesthesiaFormTextModel = mongoose.model<IBaseLookup>("AnesthesiaFormText", createLookupSchema(), SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS);
export const PatientDocumentTypeModel = mongoose.model<IBaseLookup>("PatientDocumentType", createLookupSchema(), SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES);

export const SYSTEM_TYPE_MODEL_MAP: Record<SystemTypeName, Model<IBaseLookup | ILookupWithAnimalType | IMedicine>> = {
  [SYSTEM_TYPE_NAMES.ANIMAL_TYPES]: AnimalTypeModel,
  [SYSTEM_TYPE_NAMES.RACE_TYPES]: RaceTypeModel,
  [SYSTEM_TYPE_NAMES.ANIMAL_COLORS]: AnimalColorModel,
  [SYSTEM_TYPE_NAMES.ANIMAL_VITALS]: AnimalVitalsModel,
  [SYSTEM_TYPE_NAMES.GENDER_TYPES]: GenderTypeModel,
  [SYSTEM_TYPE_NAMES.INSURANCE_TYPES]: InsuranceTypeModel,
  [SYSTEM_TYPE_NAMES.FOOD_TYPES]: FoodTypeModel,
  [SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES]: FoodExtraTypeModel,
  [SYSTEM_TYPE_NAMES.EXAMINATION_TYPES]: ExaminationTypeModel,
  [SYSTEM_TYPE_NAMES.FECES_TYPES]: FecesTypeModel,
  [SYSTEM_TYPE_NAMES.URINE_TYPES]: UrineTypeModel,
  [SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES]: DosageFrequencyModel,
  [SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES]: MeasureUnitTypeModel,
  [SYSTEM_TYPE_NAMES.PROCEDURE_TYPES]: ProcedureTypeModel,
  [SYSTEM_TYPE_NAMES.MEDICINES]: MedicineModel,
  [SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES]: MedicineCategoryModel,
  [SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION]: RouteOfAdministrationModel,
  [SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS]: AnesthesiaFormTextModel,
  [SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES]: PatientDocumentTypeModel,
};

export type {
  IAnimalVitals,
  IBaseLookup,
  ILookupWithAnimalType,
  IMedicine,
  IMedicineCategory,
  AnimalVitalsDocument,
  BaseLookupDocument,
  LookupWithAnimalTypeDocument,
  MedicineDocument,
  MedicineCategoryDocument,
} from "./Lookups.types";
