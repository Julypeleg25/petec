import path from "node:path";
import { UPLOAD_ROOT_DIR } from "../../../../src/utils/uploadPath.utils.js";
import {
  resolveStoragePath,
  sanitizeStorageKey,
  STORAGE_CONSTANTS,
} from "../../../../src/services/storage/utils/storageService.utils.js";

describe("storageService.utils", () => {
  it("sanitizes windows path separators", () => {
    expect(sanitizeStorageKey("reports\\daily\\file.pdf")).toBe(
      "reports/daily/file.pdf",
    );
  });

  it("rejects path traversal and absolute paths", () => {
    expect(() => sanitizeStorageKey("../secret.txt")).toThrow(
      "Path traversal detected: ../secret.txt",
    );
    expect(() => sanitizeStorageKey("/secret.txt")).toThrow(
      "Absolute path not allowed: /secret.txt",
    );
  });

  it("rejects storage keys that resolve outside the upload root without traversal tokens", () => {
    expect(() => resolveStoragePath("C:/escape.txt")).toThrow(
      "Storage path escapes upload directory for key: C:/escape.txt",
    );
  });

  it("resolves safe storage paths inside the upload root", () => {
    expect(resolveStoragePath("reports/file.pdf")).toBe(
      path.resolve(UPLOAD_ROOT_DIR, "reports/file.pdf"),
    );
    expect(resolveStoragePath("")).toBe(UPLOAD_ROOT_DIR);
  });

  it("exposes the storage constants", () => {
    expect(STORAGE_CONSTANTS.FILE_NOT_FOUND_ERRNO).toBe("ENOENT");
    expect(STORAGE_CONSTANTS.PATH_TRAVERSAL_TOKEN).toBe("..");
    expect(STORAGE_CONSTANTS.ABSOLUTE_PREFIX).toBe("/");
  });
});
