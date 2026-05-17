import type {
  PatientDocumentResponseDTO,
  SimpleSystemTypeDTO,
} from "@petec/shared";

export const PATIENT_DOCUMENT_NAV_TYPES = {
  BLOOD_TESTS: "blood-tests",
  XRAY: "xray",
  ANESTHESIA_PROCEDURE: "anesthesia-procedure",
} as const;

export type PatientDocumentsNavType =
  (typeof PATIENT_DOCUMENT_NAV_TYPES)[keyof typeof PATIENT_DOCUMENT_NAV_TYPES];

const PATIENT_DOCUMENT_LABELS: Record<PatientDocumentsNavType, string> = {
  [PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS]: "בדיקות דם",
  [PATIENT_DOCUMENT_NAV_TYPES.XRAY]: "צילומי רנטגן",
  [PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE]:
    "טופס הסכמה לפרוצדורה בהרדמה",
};

const PATIENT_DOCUMENT_TYPE_NAME_BY_NAV_TYPE: Partial<
  Record<PatientDocumentsNavType, string>
> = {
  [PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS]: "blood-test",
  [PATIENT_DOCUMENT_NAV_TYPES.XRAY]: "xray",
};

export const getPatientDocumentLabel = (
  navType: PatientDocumentsNavType,
): string => PATIENT_DOCUMENT_LABELS[navType];

export const getPatientDocumentType = (
  documentTypes: ReadonlyArray<SimpleSystemTypeDTO>,
  navType: PatientDocumentsNavType,
): SimpleSystemTypeDTO | undefined => {
  const systemTypeName = PATIENT_DOCUMENT_TYPE_NAME_BY_NAV_TYPE[navType];
  if (!systemTypeName) {
    return undefined;
  }

  return documentTypes.find(
    (documentType) => documentType.name === systemTypeName,
  );
};

export const getCurrentPatientDocuments = (
  documents: ReadonlyArray<PatientDocumentResponseDTO>,
  documentTypeId?: string,
): PatientDocumentResponseDTO[] => {
  if (!documentTypeId) {
    return [];
  }

  return documents.filter(
    (document) => document.patientDocumentTypeId === documentTypeId,
  );
};

export const getPatientDocumentAssetUrl = (
  document: PatientDocumentResponseDTO,
): string | undefined =>
  document.fileUrl ?? document.storageKey ?? document.url;
