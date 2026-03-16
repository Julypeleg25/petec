export const CASE_ALERTS_CONSTANTS = {
  MODULE: "caseAlerts",
  TIME_ZONE: "Asia/Jerusalem",
  ALERT_WINDOW_HOURS: 12,
  ALERT_WINDOW_MS: 12 * 60 * 60 * 1000,
  CATHETER_REMINDER_DAYS: 3,
  UNKNOWN_ROW_ID: "unknown-row",
} as const;

export const CASE_ALERT_RULES = {
  REQUIRED_MEDICATION_MISSING: "requiredMedicationMissing",
  REQUIRED_EXAMINATION_MISSING: "requiredExaminationMissing",
  REQUIRED_FOOD_EXTRA_MISSING: "requiredFoodExtraMissing",
  REQUIRED_FIELD_MISSING: "requiredFieldMissing",
  CATHETER_REMINDER: "catheterReminder",
  VITAL_OUT_OF_RANGE: "vitalOutOfRange",
} as const;

export const CASE_ALERT_FIELDS = {
  TEMPERATURE: "temperature",
  PULSE: "pulse",
  RESPIRATION: "respiration",
  MEDICINE: "medicine",
  FLUID: "fluid",
  EXAMINATION: "examination",
  FOOD_EXTRA: "foodExtra",
  URINE_TYPE_ID: "urineTypeId",
  FECES_TYPE_ID: "fecesTypeId",
  IS_BOX_CLEAN: "isBoxClean",
  IS_RELEASE: "isRelease",
  IS_TRAVEL: "isTravel",
  IS_PUKE: "isPuke",
  WEIGH: "weigh",
  FOOD_AND_WATER: "foodAndWater",
  OWNER_UPDATE: "ownerUpdate",
  ROW_COMMENTS: "rowComments",
  CATHETER_DATE: "catheterDate",
} as const;
