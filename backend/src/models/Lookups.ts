import mongoose, { Schema, Model } from "mongoose";
import type { SystemTypeName } from "@petec/shared";
import type {
  IAnimalVitals,
  IBaseLookup,
  ILookupWithAnimalType,
  IMedicine,
  IMedicineCategory,
} from "./Lookups.types";

const createLookupSchema = (): Schema<IBaseLookup> =>
  new Schema<IBaseLookup>(
    {
      name: { type: String, required: true, trim: true },
      isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true, versionKey: false },
  );

const createLookupWithAnimalTypeSchema = (): Schema<ILookupWithAnimalType> =>
  new Schema<ILookupWithAnimalType>(
    {
      name: { type: String, required: true, trim: true },
      isActive: { type: Boolean, default: true, index: true },
      animalTypeId: {
        type: Schema.Types.ObjectId,
        ref: "AnimalType",
        required: true,
        index: true,
      },
    },
    { timestamps: true, versionKey: false },
  );

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MedicineCategory", index: true },
    measureUnitId: { type: Schema.Types.ObjectId, ref: "MeasureUnitType" },
    dosageFrequencyId: { type: Schema.Types.ObjectId, ref: "DosageFrequency" },
    routeOfAdministrationId: { type: Schema.Types.ObjectId, ref: "RouteOfAdministration" },
    rangeMin: { type: Number },
    rangeMax: { type: Number },
    totalDose: { type: Number },
    comments: { type: String },
  },
  { timestamps: true, versionKey: false },
);

export const AnimalTypeModel = mongoose.model<IBaseLookup>("AnimalType", createLookupSchema());
export const RaceTypeModel = mongoose.model<ILookupWithAnimalType>("RaceType", createLookupWithAnimalTypeSchema());
export const AnimalColorModel = mongoose.model<IBaseLookup>("AnimalColor", createLookupSchema());

const animalVitalsSchema = new Schema<IAnimalVitals>(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    animalTypeId: {
      type: Schema.Types.ObjectId,
      ref: "AnimalType",
      required: true,
      index: true,
    },
    minValue: { type: Number },
    maxValue: { type: Number },
    unit: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export const AnimalVitalsModel = mongoose.model<IAnimalVitals>("AnimalVitals", animalVitalsSchema);
export const GenderTypeModel = mongoose.model<IBaseLookup>("GenderType", createLookupSchema());
export const InsuranceTypeModel = mongoose.model<IBaseLookup>("InsuranceType", createLookupSchema());
export const FoodTypeModel = mongoose.model<IBaseLookup>("FoodType", createLookupSchema());
export const FoodExtraTypeModel = mongoose.model<IBaseLookup>("FoodExtraType", createLookupSchema());
export const ExaminationTypeModel = mongoose.model<IBaseLookup>("ExaminationType", createLookupSchema());
export const FecesTypeModel = mongoose.model<IBaseLookup>("FecesType", createLookupSchema());
export const UrineTypeModel = mongoose.model<IBaseLookup>("UrineType", createLookupSchema());
export const DosageFrequencyModel = mongoose.model<IBaseLookup>("DosageFrequency", createLookupSchema());
export const MeasureUnitTypeModel = mongoose.model<IBaseLookup>("MeasureUnitType", createLookupSchema());
export const ProcedureTypeModel = mongoose.model<IBaseLookup>("ProcedureType", createLookupSchema());
export const MedicineModel = mongoose.model<IMedicine>("Medicine", medicineSchema);
export const MedicineCategoryModel = mongoose.model<IMedicineCategory>("MedicineCategory", createLookupSchema());
export const RouteOfAdministrationModel = mongoose.model<IBaseLookup>("RouteOfAdministration", createLookupSchema());
export const PatientDocumentTypeModel = mongoose.model<IBaseLookup>("PatientDocumentType", createLookupSchema());

export const SYSTEM_TYPE_MODEL_MAP: Record<SystemTypeName, Model<IBaseLookup | ILookupWithAnimalType | IMedicine>> = {
  animal_types: AnimalTypeModel,
  race_types: RaceTypeModel,
  animal_colors: AnimalColorModel,
  animal_vitals: AnimalVitalsModel,
  gender_types: GenderTypeModel,
  insurance_types: InsuranceTypeModel,
  food_types: FoodTypeModel,
  food_extra_types: FoodExtraTypeModel,
  examination_types: ExaminationTypeModel,
  feces_types: FecesTypeModel,
  urine_types: UrineTypeModel,
  dosage_frequencies: DosageFrequencyModel,
  measure_unit_types: MeasureUnitTypeModel,
  procedure_types: ProcedureTypeModel,
  medicines: MedicineModel,
  medicine_categories: MedicineCategoryModel,
  routes_of_administration: RouteOfAdministrationModel,
  patient_document_types: PatientDocumentTypeModel,
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
