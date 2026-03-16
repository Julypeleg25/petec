import { BadRequestError } from "@constants/error.constants";
import { storageService } from "@services/storage";

export const requireUploadedFile = (
  file?: Express.Multer.File,
): Express.Multer.File => {
  if (!file) {
    throw new BadRequestError("File is required");
  }
  return file;
};

export const withUploadedFileRollback = async <T>(
  storageKey: string,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    await storageService.delete(storageKey).catch(() => undefined);
    throw error;
  }
};
