import type { PatientDocumentResponseDTO } from "@petec/shared";

export type PatientDocumentsNavType =
  | "blood-tests"
  | "xray"
  | "anesthesia-procedure";

const PATIENT_DOCUMENT_LABELS: Record<PatientDocumentsNavType, string> = {
  "blood-tests": "בדיקות דם",
  xray: "צילומי רנטגן",
  "anesthesia-procedure": "טופס הסכמה לפרוצדורה בהרדמה",
};

const PATIENT_DOCUMENT_TYPE_IDS: Partial<
  Record<PatientDocumentsNavType, string>
> = {
  "blood-tests": "1",
  xray: "2",
};

export const getPatientDocumentLabel = (
  navType: PatientDocumentsNavType,
): string => PATIENT_DOCUMENT_LABELS[navType];

export const getPatientDocumentTypeId = (
  navType: PatientDocumentsNavType,
): string | undefined => PATIENT_DOCUMENT_TYPE_IDS[navType];

export const getCurrentPatientDocuments = (
  documents: PatientDocumentResponseDTO[],
  navType: PatientDocumentsNavType,
): PatientDocumentResponseDTO[] => {
  const documentTypeId = getPatientDocumentTypeId(navType);
  if (!documentTypeId) {
    return [];
  }
  return documents.filter(
    (document) => String(document.patientDocumentTypeId) === documentTypeId,
  );
};
