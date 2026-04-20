import { BadRequestError } from "../../src/constants/error.constants.js";
import {
  buildOpaqueStorageKey,
  extensionForMimeType,
  sanitizeUploadedFileName,
} from "../../src/utils/uploadFile.utils.js";

describe("uploadFile.utils", () => {
  it("resolves file extensions by mime type", () => {
    expect(extensionForMimeType(" IMAGE/JPEG ")).toBe(".jpg");
    expect(() => extensionForMimeType("application/unknown")).toThrow(
      BadRequestError,
    );
  });

  it("builds opaque storage keys with normalized prefixes", () => {
    const key = buildOpaqueStorageKey("patient-docs", "image/jpeg");

    expect(key).toMatch(/^patient-docs\/[a-f0-9]{32}\.jpg$/);
    expect(buildOpaqueStorageKey("patient-docs/", "image/png")).toMatch(
      /^patient-docs\/[a-f0-9]{32}\.png$/,
    );
  });

  it("sanitizes uploaded file names and falls back when needed", () => {
    expect(
      sanitizeUploadedFileName('  bad<>:"/\\\\|?*  report   name.pdf  ', "fallback.pdf"),
    ).toBe("bad report name.pdf");
    expect(sanitizeUploadedFileName("   ", "fallback.pdf")).toBe("fallback.pdf");
    expect(
      sanitizeUploadedFileName("a".repeat(300), "fallback.pdf"),
    ).toHaveLength(180);
  });
});