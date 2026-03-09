
const toNonEmptyConstValues = <T extends Record<string, string>>(
  values: T,
): readonly [T[keyof T], ...T[keyof T][]] =>
  Object.values(values) as unknown as readonly [T[keyof T], ...T[keyof T][]];

export const SYSTEM_TYPE_NAMES = {
  ANIMAL_TYPES: "animal_types",
  RACE_TYPES: "race_types",
  ANIMAL_COLORS: "animal_colors",
  ANIMAL_VITALS: "animal_vitals",
  GENDER_TYPES: "gender_types",
  INSURANCE_TYPES: "insurance_types",
  FOOD_TYPES: "food_types",
  FOOD_EXTRA_TYPES: "food_extra_types",
  EXAMINATION_TYPES: "examination_types",
  FECES_TYPES: "feces_types",
  URINE_TYPES: "urine_types",
  DOSAGE_FREQUENCIES: "dosage_frequencies",
  MEASURE_UNIT_TYPES: "measure_unit_types",
  PROCEDURE_TYPES: "procedure_types",
  MEDICINES: "medicines",
  MEDICINE_CATEGORIES: "medicine_categories",
  ROUTES_OF_ADMINISTRATION: "routes_of_administration",
  PATIENT_DOCUMENT_TYPES: "patient_document_types",
} as const;

export type SystemTypeName =
  (typeof SYSTEM_TYPE_NAMES)[keyof typeof SYSTEM_TYPE_NAMES];

export const SYSTEM_TYPE_NAMES_VALUES =
  toNonEmptyConstValues(SYSTEM_TYPE_NAMES);

export const MEDICINE_CATEGORY_TYPES = {
  MEDICINE: "medicine",
  FLUID: "fluid",
  FLUID_EXTRA: "fluidExtra",
} as const;

export type MedicineCategoryType =
  (typeof MEDICINE_CATEGORY_TYPES)[keyof typeof MEDICINE_CATEGORY_TYPES];

export const MEDICINE_CATEGORY_TYPE_VALUES =
  toNonEmptyConstValues(MEDICINE_CATEGORY_TYPES);
