import { MEDICINE_CATEGORY_TYPES, SYSTEM_TYPE_NAMES } from "@petec/shared";

export const MEDICINE_CATEGORY_TYPES_FOR_CASE_DETAILS = {
  MEDICINE: MEDICINE_CATEGORY_TYPES.MEDICINE,
  FLUID: MEDICINE_CATEGORY_TYPES.FLUID,
  FLUID_EXTRA: MEDICINE_CATEGORY_TYPES.FLUID_EXTRA,
} as const;

export const VITAL_NAMES = {
  TEMP: "T",
  PULSE: "P",
  RESPIRATION: "R",
} as const;

export const INITIAL_VITALS = {
  tempRangeMax: undefined,
  tempRangeMin: undefined,
  pulseRangeMax: undefined,
  pulseRangeMin: undefined,
  respirationRangeMax: undefined,
  respirationRangeMin: undefined,
} as const;

export const CASE_DETAIL_SYSTEM_TYPES = {
  FECES: SYSTEM_TYPE_NAMES.FECES_TYPES,
  URINE: SYSTEM_TYPE_NAMES.URINE_TYPES,
} as const;

export type CaseDetailSystemType =
  (typeof CASE_DETAIL_SYSTEM_TYPES)[keyof typeof CASE_DETAIL_SYSTEM_TYPES];
