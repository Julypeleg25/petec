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

const PATIENT_DOCUMENT_TYPE_SERIAL_IDS = {
  BLOOD_TESTS: "1",
  XRAY: "2",
} as const;

const PATIENT_DOCUMENT_LABELS: Record<PatientDocumentsNavType, string> = {
  [PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS]: "בדיקות דם",
  [PATIENT_DOCUMENT_NAV_TYPES.XRAY]: "צילומי רנטגן",
  [PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE]:
    "טופס הסכמה לפרוצדורה בהרדמה",
};

const PATIENT_DOCUMENT_TYPE_SERIAL_ID_BY_NAV_TYPE: Partial<
  Record<PatientDocumentsNavType, string>
> = {
  [PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS]:
    PATIENT_DOCUMENT_TYPE_SERIAL_IDS.BLOOD_TESTS,
  [PATIENT_DOCUMENT_NAV_TYPES.XRAY]: PATIENT_DOCUMENT_TYPE_SERIAL_IDS.XRAY,
};

export const getPatientDocumentLabel = (
  navType: PatientDocumentsNavType,
): string => PATIENT_DOCUMENT_LABELS[navType];

export const getPatientDocumentType = (
  documentTypes: ReadonlyArray<SimpleSystemTypeDTO>,
  navType: PatientDocumentsNavType,
): SimpleSystemTypeDTO | undefined => {
  const serialId = PATIENT_DOCUMENT_TYPE_SERIAL_ID_BY_NAV_TYPE[navType];
  if (!serialId) {
    return undefined;
  }

  return documentTypes.find((documentType) => documentType.serialId === serialId);
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
