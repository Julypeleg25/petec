import path from "node:path";
import { UPLOAD_ROOT_DIR } from "../utils/uploadPath.utils.js";
import { getUploadedStorageKey } from "./upload.js";

describe("upload helpers", () => {
  it("returns the stored storage key when multer attached one", () => {
    expect(
      getUploadedStorageKey({
        storageKey: "patients\\photos\\abc.jpg",
      } as never),
    ).toBe("patients/photos/abc.jpg");
  });

  it("falls back to the original name when destination data is missing", () => {
    expect(
      getUploadedStorageKey({
        originalname: "source-name.pdf",
      } as never),
    ).toBe("source-name.pdf");
  });

  it("derives a relative storage key from destination and filename", () => {
    expect(
      getUploadedStorageKey({
        originalname: "ignored.pdf",
        destination: path.join(UPLOAD_ROOT_DIR, "patients", "documents"),
        filename: "opaque-file.pdf",
      } as never),
    ).toBe("patients/documents/opaque-file.pdf");
  });
});
