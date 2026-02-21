import { SYSTEM_TYPE_NAMES } from "@petec/shared";

export const MEDICINE_CATEGORY_IDS = {
  MEDICINE: "1",
  FLUID: "2",
  FLUID_EXTRA: "3",
} as const;

export const VITAL_NAMES = {
  TEMP: "Temp",
  PULSE: "Pulse",
  RESPIRATION: "Respiration",
} as const;

export const EMPTY_SELECT_VALUE = "";
export const DEFAULT_NUMERIC_VALUE = 0;
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
