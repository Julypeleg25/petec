export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as readonly string[],
} as const;
