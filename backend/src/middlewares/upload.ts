import fs from "node:fs";
import path from "node:path";
import multer, { FileFilterCallback } from "multer";
import type { Request } from "express";
import { UPLOAD } from "@petec/shared";
import { ValidationError } from "@constants/error.constants";
import { logger } from "@config/logger";
import { buildOpaqueStorageKey } from "@utils/uploadFile.utils";
import { UPLOAD_ROOT_DIR, toPosixPath } from "@utils/uploadPath.utils";

type MulterFileWithKey = Express.Multer.File & { storageKey?: string };
const MODULE = "upload";

const BULK_TEMPLATE_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
] as const;

const ensureDirSync = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

const createFileFilter = (
  allowedMimeTypes: ReadonlyArray<string>,
): ((_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void) =>
  (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    logger.warn("Upload rejected due to invalid mime type", {
      module: MODULE,
      mime_type: file.mimetype,
    });
    cb(new ValidationError(`File type ${file.mimetype} is not allowed`));
  };

const createDiskStorage = (prefix: string) =>
  multer.diskStorage({
    destination: (_req, file, cb) => {
      try {
        const storageKey = buildOpaqueStorageKey(prefix, file.mimetype);
        (file as MulterFileWithKey).storageKey = storageKey;

        const absoluteFilePath = path.resolve(UPLOAD_ROOT_DIR, storageKey);
        const dir = path.dirname(absoluteFilePath);
        ensureDirSync(dir);
        logger.info("Upload destination prepared", {
          module: MODULE,
          storage_key: storageKey,
        });

        cb(null, dir);
      } catch (error) {
        cb(error as Error, "");
      }
    },
    filename: (_req, file, cb) => {
      const storageKey = (file as MulterFileWithKey).storageKey;
      if (!storageKey) {
        cb(new Error("storageKey missing for upload"), "");
        return;
      }
      cb(null, path.basename(storageKey));
    },
  });

const createDiskUpload = (
  allowedMimeTypes: ReadonlyArray<string>,
  maxFileSizeBytes: number,
  prefix: string,
): multer.Multer =>
  multer({
    storage: createDiskStorage(prefix),
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: createFileFilter(allowedMimeTypes),
  });

const createMemoryUpload = (
  allowedMimeTypes: ReadonlyArray<string>,
  maxFileSizeBytes: number,
): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: createFileFilter(allowedMimeTypes),
  });

export const uploadImage = createMemoryUpload(
  UPLOAD.IMAGE_MIME_TYPES,
  UPLOAD.MAX_FILE_SIZE_BYTES,
);

export const uploadDocument = createMemoryUpload(
  UPLOAD.DOCUMENT_MIME_TYPES,
  UPLOAD.MAX_FILE_SIZE_BYTES,
);

export const uploadBulkTemplate = createMemoryUpload(
  BULK_TEMPLATE_MIME_TYPES,
  UPLOAD.MAX_FILE_SIZE_BYTES,
);

export const getUploadedStorageKey = (file: Express.Multer.File): string => {
  const withKey = file as MulterFileWithKey;
  if (withKey.storageKey && withKey.storageKey.length > 0) {
    return toPosixPath(withKey.storageKey);
  }

  if (!file.destination || !file.filename) {
    return file.originalname;
  }

  const destination = (file as Express.Multer.File & { destination?: string })
    .destination;
  const filename = file.filename;
  if (!destination || !filename) {
    throw new Error("Unable to derive storageKey from uploaded file");
  }

  const relativePath = path.relative(
    UPLOAD_ROOT_DIR,
    path.join(destination, filename),
  );
  return toPosixPath(relativePath);
};
