export const CASE_DATE_FIELDS = {
  CATHETER_DATE: "catheterDate",
  PROCEDURE_DATE: "procedureDate",
  NEXT_INSPECTION_DATE: "nextInspectionDate",
  STITCHES_REMOVAL_DATE: "stitchesRemovalDate",
} as const;
export type CaseDateField =
  (typeof CASE_DATE_FIELDS)[keyof typeof CASE_DATE_FIELDS];

export const DEFAULT_PATIENT_IMAGE = "/assets/images/default_patient_image.jpg";

