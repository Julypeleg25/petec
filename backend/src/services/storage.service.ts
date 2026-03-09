import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { logger } from "@config/logger";
import {
  resolveStoragePath,
  STORAGE_CONSTANTS,
} from "@services/utils/storage.service.utils";

const MODULE = STORAGE_CONSTANTS.MODULE;

export class StorageService {
  resolveAbsolutePath(key: string): string {
    return resolveStoragePath(key);
  }

  createReadStream(key: string): fs.ReadStream {
    const filePath = resolveStoragePath(key);
    return fs.createReadStream(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = resolveStoragePath(key);
    try {
      await fsPromises.unlink(filePath);
      logger.info("File deleted", { module: MODULE, key });
    } catch (err) {
      if (
        (err as NodeJS.ErrnoException).code ===
        STORAGE_CONSTANTS.FILE_NOT_FOUND_ERRNO
      ) {
        logger.warn("File not found during delete, skipping", {
          module: MODULE,
          key,
        });
        return;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = resolveStoragePath(key);
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async read(key: string): Promise<Buffer> {
    const filePath = resolveStoragePath(key);
    return fsPromises.readFile(filePath);
  }

  async save(key: string, data: Buffer): Promise<string> {
    const filePath = resolveStoragePath(key);
    await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
    await fsPromises.writeFile(filePath, data);
    logger.info("File saved", { module: MODULE, key });
    return key;
  }
}

export const storageService = new StorageService();
