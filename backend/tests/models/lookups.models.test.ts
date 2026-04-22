import {
  MEDICINE_CATEGORY_TYPE_VALUES,
  SYSTEM_TYPE_NAMES,
} from "@petec/shared";
import {
  AnimalColorModel,
  AnimalTypeModel,
  AnimalVitalsModel,
  AnesthesiaFormTextModel,
  DosageFrequencyModel,
  ExaminationTypeModel,
  FecesTypeModel,
  FoodExtraTypeModel,
  FoodTypeModel,
  GenderTypeModel,
  InsuranceTypeModel,
  MeasureUnitTypeModel,
  MedicineCategoryModel,
  MedicineModel,
  PatientDocumentTypeModel,
  ProcedureTypeModel,
  RaceTypeModel,
  RouteOfAdministrationModel,
  SYSTEM_TYPE_MODEL_MAP,
  UrineTypeModel,
} from "../../src/models/index.js";

const hasIndex = (
  indexes: Array<[Record<string, unknown>, Record<string, unknown>]>,
  fields: Record<string, unknown>,
  options: Record<string, unknown> = {},
): boolean =>
  indexes.some(
    ([actualFields, actualOptions]) =>
      JSON.stringify(actualFields) === JSON.stringify(fields)
      && Object.entries(options).every(([key, value]) => actualOptions[key] === value),
  );

describe("lookup models", () => {
  it("defines shared lookup collections with soft-delete and sparse serial indexes", () => {
    const sharedModels = [
      [AnimalTypeModel, SYSTEM_TYPE_NAMES.ANIMAL_TYPES],
      [AnimalColorModel, SYSTEM_TYPE_NAMES.ANIMAL_COLORS],
      [GenderTypeModel, SYSTEM_TYPE_NAMES.GENDER_TYPES],
      [InsuranceTypeModel, SYSTEM_TYPE_NAMES.INSURANCE_TYPES],
      [FoodTypeModel, SYSTEM_TYPE_NAMES.FOOD_TYPES],
      [FoodExtraTypeModel, SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES],
      [ExaminationTypeModel, SYSTEM_TYPE_NAMES.EXAMINATION_TYPES],
      [FecesTypeModel, SYSTEM_TYPE_NAMES.FECES_TYPES],
      [UrineTypeModel, SYSTEM_TYPE_NAMES.URINE_TYPES],
      [DosageFrequencyModel, SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES],
      [MeasureUnitTypeModel, SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES],
      [ProcedureTypeModel, SYSTEM_TYPE_NAMES.PROCEDURE_TYPES],
      [RouteOfAdministrationModel, SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION],
      [AnesthesiaFormTextModel, SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS],
      [PatientDocumentTypeModel, SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES],
    ] as const;

    for (const [model, collectionName] of sharedModels) {
      expect(model.collection.collectionName).toBe(collectionName);
      expect(model.schema.path("name").options.required).toBe(true);
      expect(model.schema.path("isDeleted").options.default).toBe(false);
      expect(model.schema.path("isDeleted").options.index).toBe(true);
      expect(hasIndex(model.schema.indexes(), { serialId: 1 }, { unique: true, sparse: true })).toBe(true);
    }
  });

  it("defines the race type lookup with an animal type reference", () => {
    expect(RaceTypeModel.collection.collectionName).toBe(SYSTEM_TYPE_NAMES.RACE_TYPES);
    expect(RaceTypeModel.schema.path("animalTypeId").options.ref).toBe("AnimalType");
    expect(RaceTypeModel.schema.path("animalTypeId").options.required).toBe(true);
    expect(RaceTypeModel.schema.path("animalTypeId").options.index).toBe(true);
    expect(hasIndex(RaceTypeModel.schema.indexes(), { serialId: 1 }, { unique: true, sparse: true })).toBe(true);
  });

  it("defines the animal vitals lookup", () => {
    expect(AnimalVitalsModel.collection.collectionName).toBe(SYSTEM_TYPE_NAMES.ANIMAL_VITALS);
    expect(AnimalVitalsModel.schema.path("animalTypeId").options.ref).toBe("AnimalType");
    expect(AnimalVitalsModel.schema.path("animalTypeId").options.required).toBe(true);
    expect(AnimalVitalsModel.schema.path("animalTypeId").options.index).toBe(true);
    expect(AnimalVitalsModel.schema.path("vitalsType").instance).toBe("String");
    expect(hasIndex(AnimalVitalsModel.schema.indexes(), { serialId: 1 }, { unique: true, sparse: true })).toBe(true);
  });

  it("defines the medicine lookup", () => {
    expect(MedicineModel.collection.collectionName).toBe(SYSTEM_TYPE_NAMES.MEDICINES);
    expect(MedicineModel.schema.path("name").options.required).toBe(true);
    expect(MedicineModel.schema.path("name").options.index).toBe(true);
    expect(MedicineModel.schema.path("categoryId").options.ref).toBe("MedicineCategory");
    expect(MedicineModel.schema.path("measureUnitTypeId").options.ref).toBe("MeasureUnitType");
    expect(MedicineModel.schema.path("dosageFrequencyId").options.ref).toBe("DosageFrequency");
    expect(MedicineModel.schema.path("routeOfAdministrationId").options.ref).toBe("RouteOfAdministration");
    expect(hasIndex(MedicineModel.schema.indexes(), { serialId: 1 }, { unique: true, sparse: true })).toBe(true);
  });

  it("defines the medicine category lookup", () => {
    expect(MedicineCategoryModel.collection.collectionName).toBe(
      SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
    );
    expect(MedicineCategoryModel.schema.path("type").options.enum).toEqual(
      MEDICINE_CATEGORY_TYPE_VALUES,
    );
    expect(MedicineCategoryModel.schema.path("type").options.unique).toBe(true);
    expect(MedicineCategoryModel.schema.path("type").options.index).toBe(true);
    expect(hasIndex(MedicineCategoryModel.schema.indexes(), { serialId: 1 }, { unique: true, sparse: true })).toBe(true);
  });

  it("maps every supported system type name to the expected mongoose model", () => {
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.ANIMAL_TYPES]).toBe(AnimalTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.RACE_TYPES]).toBe(RaceTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.ANIMAL_COLORS]).toBe(AnimalColorModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.ANIMAL_VITALS]).toBe(AnimalVitalsModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.GENDER_TYPES]).toBe(GenderTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.INSURANCE_TYPES]).toBe(InsuranceTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.FOOD_TYPES]).toBe(FoodTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES]).toBe(FoodExtraTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.EXAMINATION_TYPES]).toBe(ExaminationTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.FECES_TYPES]).toBe(FecesTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.URINE_TYPES]).toBe(UrineTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES]).toBe(DosageFrequencyModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES]).toBe(MeasureUnitTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.PROCEDURE_TYPES]).toBe(ProcedureTypeModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.MEDICINES]).toBe(MedicineModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES]).toBe(MedicineCategoryModel);
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION]).toBe(
      RouteOfAdministrationModel,
    );
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS]).toBe(
      AnesthesiaFormTextModel,
    );
    expect(SYSTEM_TYPE_MODEL_MAP[SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES]).toBe(
      PatientDocumentTypeModel,
    );
  });
});
