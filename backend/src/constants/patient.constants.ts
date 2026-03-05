export const PATIENT_STORAGE = {
  DOCUMENTS_PREFIX: "patients/documents/",
  PHOTOS_PREFIX: "patients/photos/",
  LEGACY_DOCUMENTS_PREFIX: "documents/",
  LEGACY_PHOTOS_PREFIX: "photos/",
  DEFAULT_DOCUMENT_FILE_NAME: "document",
} as const;

export const PATIENT_EXPORT = {
  CONTENT_DISPOSITION_HEADER: "Content-Disposition",
  CONTENT_TYPE_HEADER: "Content-Type",
  CONTENT_LENGTH_HEADER: "Content-Length",
  PDF_CONTENT_TYPE: "application/pdf",
  FILE_NAME_PREFIX: "case-",
  FILE_NAME_EXTENSION: ".pdf",
  ATTACHMENT_PREFIX: 'attachment; filename="',
  ATTACHMENT_SUFFIX: '"',
} as const;
