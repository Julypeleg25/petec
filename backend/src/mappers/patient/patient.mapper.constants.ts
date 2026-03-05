export const PATIENT_MAPPER_OBJECT_KEYS = {
  ID: "_id",
  NAME: "name",
  OWNER: "owner",
  TO_HEX_STRING: "toHexString",
} as const;

export const PATIENT_MAPPER_DEFAULTS = {
  EMPTY_TEXT: "",
  UNKNOWN_DATE_GROUP: "unknown",
  CHART_POINT_LABEL_PREFIX: "Point ",
  DEFAULT_IMAGE_CONTENT_TYPE: "image/jpeg",
  WEIGHT_SERIES_NAME: "weight",
} as const;

export const PATIENT_CHART_SERIES_KEYS = {
  TEMP: "temp",
  PULSE: "pulse",
  RESPIRATION: "rr",
} as const;

export type PatientChartSeriesKey =
  (typeof PATIENT_CHART_SERIES_KEYS)[keyof typeof PATIENT_CHART_SERIES_KEYS];

export const PATIENT_PROCEDURE_STATUS = {
  DONE: "done",
} as const;

export const PATIENT_IMAGE_CONTENT_TYPE_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
} as const;

export const PATIENT_ASSET_PATHS = {
  DEFAULT_PATIENT_IMAGE: "/assets/images/default-patient-image.jpg",
} as const;
