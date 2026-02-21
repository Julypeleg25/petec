export const TABLE_ALLOW_LIST = [
  "patients",
  "cases",
  "audit_logs",
  "users",
  "animal_types",
  "race_types",
  "animal_colors",
  "animal_vitals",
  "gender_types",
  "insurance_types",
  "food_types",
  "food_extra_types",
  "examination_types",
  "feces_types",
  "urine_types",
  "dosage_frequencies",
  "measure_unit_types",
  "procedure_types",
  "medicines",
  "medicine_categories",
  "routes_of_administration",
  "patient_document_types",
] as const;

export const SortOrders = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const SORT_ORDER_VALUES = [SortOrders.ASC, SortOrders.DESC] as const;

export const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
} as const;

export const TABLE_DEFAULT_SORT_BY = "createdAt";
