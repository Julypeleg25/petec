
export const PATIENTS_CARDS_AMOUNT = 12;
export const MOBILE_TABLE_BREAKPOINT_PX = 720;
export const DEFAULT_PATIENT_IMAGE = "/assets/images/default-patient-image.jpg";

export const PATIENT_TABLE_TYPES = {
  PATIENTS: "patients",
  PROCEDURES: "procedures",
} as const;

export const PATIENTS_NAV_TYPES = {
  ARCHIVE: "archive",
  DAILY_PLAN: "daily-plan",
  NEW_PATIENT: "new-patient",
  PATIENTS_LIST: "patients-list",
  PATIENT_CASE: "patientCase",
  PROCEDURES: "procedures",
} as const;

export const TABLE_QUERY_KEYS = {
  PATIENTS: "patients",
  CASES: "cases",
} as const;

export const TABLE_ORDER_BY = {
  CREATED_AT: "created_at",
  DESC: "DESC",
} as const;

export const CARD_LAYOUT = {
  WIDTH: "230px",
  MARGIN: "1em",
} as const;

export const SEARCH_FILTER_KEYS = {
  SEARCH: "search",
  MASTER_CASE_ID: "masterCaseId",
} as const;
