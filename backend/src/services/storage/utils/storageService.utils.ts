import path from "node:path";
import { UPLOAD_ROOT_DIR } from "../../../utils/uploadPath.utils.js";

export const STORAGE_CONSTANTS = {
  MODULE: "storage",
  FILE_NOT_FOUND_ERRNO: "ENOENT",
  PATH_TRAVERSAL_TOKEN: "..",
  ABSOLUTE_PREFIX: "/",
} as const;

export const sanitizeStorageKey = (key: string): string => {
  const normalized = key.replace(/\\/g, "/");
  if (normalized.includes(STORAGE_CONSTANTS.PATH_TRAVERSAL_TOKEN)) {
    throw new Error(`Path traversal detected: ${normalized}`);
  }
  if (normalized.startsWith(STORAGE_CONSTANTS.ABSOLUTE_PREFIX)) {
    throw new Error(`Absolute path not allowed: ${normalized}`);
  }
  return normalized;
};

export const resolveStoragePath = (key: string): string => {
  const safeKey = sanitizeStorageKey(key);
  const absolutePath = path.resolve(UPLOAD_ROOT_DIR, safeKey);
  const allowedPrefix = `${UPLOAD_ROOT_DIR}${path.sep}`;

  if (absolutePath !== UPLOAD_ROOT_DIR && !absolutePath.startsWith(allowedPrefix)) {
    throw new Error(`Storage path escapes upload directory for key: ${key}`);
  }

  return absolutePath;
};
