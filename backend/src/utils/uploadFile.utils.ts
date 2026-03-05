import { randomUUID } from "crypto";
import { BadRequestError } from "@constants/error.constants";

const MIME_TYPE_EXTENSION_MAP: Readonly<Record<string, string>> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
};

const UUID_HYPHEN_REGEX = /-/g;
const INVALID_FILE_NAME_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g;
const FILE_NAME_WHITESPACE_REGEX = /\s+/g;
const MAX_FILE_NAME_LENGTH = 180;

const normalizeStoragePrefix = (prefix: string): string =>
  prefix.endsWith("/") ? prefix : `${prefix}/`;

const createOpaqueStorageObjectId = (): string =>
  randomUUID().replace(UUID_HYPHEN_REGEX, "");

export const extensionForMimeType = (mimeType: string): string => {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  const extension = MIME_TYPE_EXTENSION_MAP[normalizedMimeType];
  if (!extension) {
    throw new BadRequestError(`Unsupported file mime type: ${mimeType}`);
  }
  return extension;
};

export const buildOpaqueStorageKey = (
  prefix: string,
  mimeType: string,
): string =>
  `${normalizeStoragePrefix(prefix)}${createOpaqueStorageObjectId()}${extensionForMimeType(mimeType)}`;

export const sanitizeUploadedFileName = (
  fileName: string | undefined,
  fallbackFileName: string,
): string => {
  const normalizedFileName = (fileName ?? "")
    .trim()
    .replace(FILE_NAME_WHITESPACE_REGEX, " ")
    .replace(INVALID_FILE_NAME_CHARS_REGEX, "");

  if (!normalizedFileName) {
    return fallbackFileName;
  }

  return normalizedFileName.slice(0, MAX_FILE_NAME_LENGTH);
};
