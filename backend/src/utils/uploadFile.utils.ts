import { randomUUID } from "crypto";
import { FILE_EXTENSION_BY_MIME_TYPE } from "@petec/shared";
import { BadRequestError } from "../constants/error.constants.js";

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
  const extension =
    FILE_EXTENSION_BY_MIME_TYPE[
      normalizedMimeType as keyof typeof FILE_EXTENSION_BY_MIME_TYPE
    ];
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
