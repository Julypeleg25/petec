import mongoose, { Schema, Model } from "mongoose";
import type { SystemTypeName } from "@petec/shared";
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

const createLookupWithAnimalTypeSchema = (): Schema<ILookupWithAnimalType> =>
{
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
medicineSchema.index({ serialId: 1 }, { unique: true, sparse: true });

export const AnimalTypeModel = mongoose.model<IBaseLookup>("AnimalType", createLookupSchema(), "animal_types");
export const RaceTypeModel = mongoose.model<ILookupWithAnimalType>("RaceType", createLookupWithAnimalTypeSchema(), "race_types");
export const AnimalColorModel = mongoose.model<IBaseLookup>("AnimalColor", createLookupSchema(), "animal_colors");

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
    minValue: { type: Number },
    maxValue: { type: Number },
    unit: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);
animalVitalsSchema.index({ serialId: 1 }, { unique: true, sparse: true });

export const AnimalVitalsModel = mongoose.model<IAnimalVitals>("AnimalVitals", animalVitalsSchema, "animal_vitals");
export const GenderTypeModel = mongoose.model<IBaseLookup>("GenderType", createLookupSchema(), "gender_types");
export const InsuranceTypeModel = mongoose.model<IBaseLookup>("InsuranceType", createLookupSchema(), "insurance_types");
export const FoodTypeModel = mongoose.model<IBaseLookup>("FoodType", createLookupSchema(), "food_types");
export const FoodExtraTypeModel = mongoose.model<IBaseLookup>("FoodExtraType", createLookupSchema(), "food_extra_types");
export const ExaminationTypeModel = mongoose.model<IBaseLookup>("ExaminationType", createLookupSchema(), "examination_types");
export const FecesTypeModel = mongoose.model<IBaseLookup>("FecesType", createLookupSchema(), "feces_types");
export const UrineTypeModel = mongoose.model<IBaseLookup>("UrineType", createLookupSchema(), "urine_types");
export const DosageFrequencyModel = mongoose.model<IBaseLookup>("DosageFrequency", createLookupSchema(), "dosage_frequencies");
export const MeasureUnitTypeModel = mongoose.model<IBaseLookup>("MeasureUnitType", createLookupSchema(), "measure_unit_types");
export const ProcedureTypeModel = mongoose.model<IBaseLookup>("ProcedureType", createLookupSchema(), "procedure_types");
export const MedicineModel = mongoose.model<IMedicine>("Medicine", medicineSchema, "medicines");
export const MedicineCategoryModel = mongoose.model<IMedicineCategory>("MedicineCategory", createLookupSchema(), "medicine_categories");
export const RouteOfAdministrationModel = mongoose.model<IBaseLookup>("RouteOfAdministration", createLookupSchema(), "routes_of_administration");
export const PatientDocumentTypeModel = mongoose.model<IBaseLookup>("PatientDocumentType", createLookupSchema(), "patient_document_types");

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
