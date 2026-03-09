import { DEFAULT_PATIENT_IMAGE, UPLOAD } from "@petec/shared";

export const PATIENTS_CARDS_AMOUNT = 12;
export { DEFAULT_PATIENT_IMAGE };

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

export const PATIENTS_UPLOAD_FILE_FIELD_NAME = UPLOAD.FILE_FORM_FIELD_NAME;