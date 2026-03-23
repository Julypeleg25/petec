import { rm } from "node:fs/promises";
import { logger } from "../config/logger.js";

type CleanupFileOptions = Readonly<{
  reason?: string;
}>;

export const cleanupFile = (
  filePath: string,
  options: CleanupFileOptions = {},
): void => {
  const { reason } = options;

  void rm(filePath, { force: true }).catch((error: unknown) => {
    logger.warn("Failed to delete file", {
      file_path: filePath,
      reason,
      error,
    });
  });
};
