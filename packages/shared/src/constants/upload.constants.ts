export const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg";

export const IMAGE_MIME_TYPES = [
  DEFAULT_IMAGE_MIME_TYPE,
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const DOCUMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const FILE_EXTENSION_BY_MIME_TYPE = {
  [DEFAULT_IMAGE_MIME_TYPE]: ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
} as const;

export const IMAGE_MIME_TYPE_BY_EXTENSION = {
  ".jpg": DEFAULT_IMAGE_MIME_TYPE,
  ".jpeg": DEFAULT_IMAGE_MIME_TYPE,
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
} as const;

const PATIENT_PHOTOS_DIR = "patients/photos";
const PATIENT_DOCUMENTS_DIR = "patients/documents";

export const UPLOAD = {
  ROOT_DIR_NAME: "uploads",
  PATIENT_PHOTOS_DIR,
  PATIENT_DOCUMENTS_DIR,
  PATIENT_PHOTOS_PREFIX: `${PATIENT_PHOTOS_DIR}/`,
  PATIENT_DOCUMENTS_PREFIX: `${PATIENT_DOCUMENTS_DIR}/`,
  FILE_FORM_FIELD_NAME: "file",
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
} as const;
