import path from "node:path";
import { jest } from "@jest/globals";
import { UPLOAD } from "@petec/shared";

describe("uploadPath.utils", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("builds the upload root from ENV.uploadDir", async () => {
    jest.unstable_mockModule("../config/config.js", () => ({
      ENV: {
        uploadDir: "custom-uploads",
      },
    }));

    const { UPLOAD_ROOT_DIR, toPosixPath } = await import("./uploadPath.utils.js");

    expect(UPLOAD_ROOT_DIR).toBe(path.resolve(process.cwd(), "custom-uploads"));
    expect(toPosixPath("folder\\nested\\file.pdf")).toBe("folder/nested/file.pdf");
  });

  it("falls back to the shared upload root dir name", async () => {
    jest.unstable_mockModule("../config/config.js", () => ({
      ENV: {
        uploadDir: undefined,
      },
    }));

    const { UPLOAD_ROOT_DIR } = await import("./uploadPath.utils.js");

    expect(UPLOAD_ROOT_DIR).toBe(
      path.resolve(process.cwd(), UPLOAD.ROOT_DIR_NAME),
    );
  });
});
