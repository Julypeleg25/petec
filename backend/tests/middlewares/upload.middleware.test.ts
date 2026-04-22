import path from "node:path";
import { UPLOAD } from "@petec/shared";
import { jest } from "@jest/globals";
import { ValidationError } from "../../src/constants/error.constants.js";
import { UPLOAD_ROOT_DIR } from "../../src/utils/uploadPath.utils.js";

type CapturedUpload = {
  options: {
    storage: unknown;
    limits: {
      fileSize: number;
    };
    fileFilter: (
      req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile?: boolean) => void,
    ) => void;
  };
};

type CapturedDiskStorage = {
  destination: (
    req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => void;
  filename: (
    req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => void;
};

const multerFactoryMock = jest.fn<(options: CapturedUpload["options"]) => CapturedUpload>();
const memoryStorageMock = jest.fn<() => string>();
const diskStorageMock = jest.fn<(options: unknown) => unknown>();
const mkdirSyncMock = jest.fn();
const buildOpaqueStorageKeyMock = jest.fn<(prefix: string, mimeType: string) => string>();
const warnMock = jest.fn();
const infoMock = jest.fn();

const loadUploadModule = async () => {
  jest.resetModules();
  multerFactoryMock.mockReset();
  memoryStorageMock.mockReset();
  diskStorageMock.mockReset();
  mkdirSyncMock.mockReset();
  buildOpaqueStorageKeyMock.mockReset();
  warnMock.mockReset();
  infoMock.mockReset();

  memoryStorageMock.mockReturnValue("memory-storage");
  diskStorageMock.mockImplementation((options) => options);
  multerFactoryMock.mockImplementation((options) => ({ options }));

  const multerDefault = Object.assign(multerFactoryMock, {
    memoryStorage: memoryStorageMock,
    diskStorage: diskStorageMock,
  });

  jest.unstable_mockModule("multer", () => ({
    default: multerDefault,
  }));

  jest.unstable_mockModule("node:fs", () => ({
    default: {
      mkdirSync: mkdirSyncMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/logger.js", () => ({
    logger: {
      warn: warnMock,
      info: infoMock,
    },
  }));

  jest.unstable_mockModule("../../src/utils/uploadFile.utils.js", () => ({
    buildOpaqueStorageKey: buildOpaqueStorageKeyMock,
  }));

  return import("../../src/middlewares/upload.js");
};

describe("upload middleware", () => {
  it("configures the exported upload middlewares with in-memory storage and size limits", async () => {
    const { uploadBulkTemplate, uploadDocument, uploadImage } = await loadUploadModule();

    expect(multerFactoryMock).toHaveBeenCalledTimes(3);
    expect(memoryStorageMock).toHaveBeenCalledTimes(3);
    expect(diskStorageMock).not.toHaveBeenCalled();

    expect((uploadImage as unknown as CapturedUpload).options.storage).toBe("memory-storage");
    expect((uploadDocument as unknown as CapturedUpload).options.storage).toBe("memory-storage");
    expect((uploadBulkTemplate as unknown as CapturedUpload).options.storage).toBe("memory-storage");

    expect((uploadImage as unknown as CapturedUpload).options.limits.fileSize).toBe(
      UPLOAD.MAX_FILE_SIZE_BYTES,
    );
    expect((uploadDocument as unknown as CapturedUpload).options.limits.fileSize).toBe(
      UPLOAD.MAX_FILE_SIZE_BYTES,
    );
    expect((uploadBulkTemplate as unknown as CapturedUpload).options.limits.fileSize).toBe(
      UPLOAD.MAX_FILE_SIZE_BYTES,
    );
  });

  it("accepts allowed mime types and rejects invalid ones with a validation error", async () => {
    const { uploadBulkTemplate, uploadDocument, uploadImage } = await loadUploadModule();
    const imageCallback = jest.fn();
    const bulkCallback = jest.fn();
    const invalidCallback = jest.fn();

    (uploadImage as unknown as CapturedUpload).options.fileFilter(
      {},
      { mimetype: UPLOAD.IMAGE_MIME_TYPES[0] } as never,
      imageCallback,
    );
    (uploadBulkTemplate as unknown as CapturedUpload).options.fileFilter(
      {},
      { mimetype: "text/plain" } as never,
      bulkCallback,
    );
    (uploadDocument as unknown as CapturedUpload).options.fileFilter(
      {},
      { mimetype: "application/x-unknown" } as never,
      invalidCallback,
    );

    expect(imageCallback).toHaveBeenCalledWith(null, true);
    expect(bulkCallback).toHaveBeenCalledWith(null, true);

    const rejectionError = invalidCallback.mock.calls[0]?.[0];
    expect(rejectionError).toBeInstanceOf(Error);
    expect((rejectionError as Error).name).toBe(ValidationError.name);
    expect((rejectionError as Error).message).toBe(
      "File type application/x-unknown is not allowed",
    );
    expect(warnMock).toHaveBeenCalledWith(
      "Upload rejected due to invalid mime type",
      {
        module: "upload",
        mime_type: "application/x-unknown",
      },
    );
  });

  it("creates directories recursively when preparing disk storage paths", async () => {
    const { ensureDirSync } = await loadUploadModule();

    ensureDirSync("C:\\uploads\\patients");

    expect(mkdirSyncMock).toHaveBeenCalledWith("C:\\uploads\\patients", {
      recursive: true,
    });
  });

  it("prepares disk upload destinations and filenames from generated storage keys", async () => {
    const { createDiskStorage } = await loadUploadModule();
    buildOpaqueStorageKeyMock.mockReturnValue("patients/documents/opaque-file.pdf");
    const storage = createDiskStorage("patients/documents") as unknown as CapturedDiskStorage;
    const destinationCallback = jest.fn();
    const filenameCallback = jest.fn();
    const file = {
      mimetype: "application/pdf",
    } as Express.Multer.File & { storageKey?: string };
    const expectedDir = path.dirname(
      path.resolve(UPLOAD_ROOT_DIR, "patients/documents/opaque-file.pdf"),
    );

    storage.destination({}, file, destinationCallback);
    storage.filename({}, file, filenameCallback);

    expect(buildOpaqueStorageKeyMock).toHaveBeenCalledWith(
      "patients/documents",
      "application/pdf",
    );
    expect(file.storageKey).toBe("patients/documents/opaque-file.pdf");
    expect(mkdirSyncMock).toHaveBeenCalledWith(expectedDir, {
      recursive: true,
    });
    expect(infoMock).toHaveBeenCalledWith("Upload destination prepared", {
      module: "upload",
      storage_key: "patients/documents/opaque-file.pdf",
    });
    expect(destinationCallback).toHaveBeenCalledWith(null, expectedDir);
    expect(filenameCallback).toHaveBeenCalledWith(null, "opaque-file.pdf");
  });

  it("propagates disk upload preparation errors and rejects filenames without storage keys", async () => {
    const diskStorageError = new Error("storage failed");
    const { createDiskStorage } = await loadUploadModule();
    buildOpaqueStorageKeyMock.mockImplementation(() => {
      throw diskStorageError;
    });
    const storage = createDiskStorage("patients/documents") as unknown as CapturedDiskStorage;
    const destinationCallback = jest.fn();
    const filenameCallback = jest.fn();

    storage.destination(
      {},
      { mimetype: "application/pdf" } as Express.Multer.File,
      destinationCallback,
    );
    storage.filename({}, {} as Express.Multer.File, filenameCallback);

    expect(destinationCallback).toHaveBeenCalledWith(diskStorageError, "");
    expect(filenameCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "storageKey missing for upload",
      }),
      "",
    );
  });

  it("creates disk upload middleware with disk storage, limits, and file filters", async () => {
    const { createDiskUpload } = await loadUploadModule();
    buildOpaqueStorageKeyMock.mockReturnValue("patients/documents/generated.pdf");
    multerFactoryMock.mockClear();
    diskStorageMock.mockClear();

    const upload = createDiskUpload(
      ["application/pdf"],
      2048,
      "patients/documents",
    ) as unknown as CapturedUpload;
    const callback = jest.fn();

    upload.options.fileFilter(
      {},
      { mimetype: "application/pdf" } as Express.Multer.File,
      callback,
    );

    expect(diskStorageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: expect.any(Function),
        filename: expect.any(Function),
      }),
    );
    expect(multerFactoryMock).toHaveBeenCalledWith({
      storage: expect.objectContaining({
        destination: expect.any(Function),
        filename: expect.any(Function),
      }),
      limits: { fileSize: 2048 },
      fileFilter: expect.any(Function),
    });
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("throws when a later destination lookup can no longer derive the storage key", async () => {
    const { getUploadedStorageKey } = await loadUploadModule();
    let destinationReadCount = 0;
    const file = {
      originalname: "fallback.pdf",
      get destination() {
        destinationReadCount += 1;
        return destinationReadCount === 1 ? "C:\\uploads\\documents" : undefined;
      },
      filename: "opaque.pdf",
    };

    expect(() => getUploadedStorageKey(file as never)).toThrow(
      "Unable to derive storageKey from uploaded file",
    );
  });
});
