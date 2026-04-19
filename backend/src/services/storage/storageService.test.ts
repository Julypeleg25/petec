import { jest } from "@jest/globals";

const createReadStreamMock = jest.fn();
const unlinkMock = jest.fn<(filePath: string) => Promise<void>>();
const accessMock = jest.fn<(filePath: string) => Promise<void>>();
const readFileMock = jest.fn<(filePath: string) => Promise<Buffer>>();
const mkdirMock = jest.fn<(filePath: string, options: { recursive: boolean }) => Promise<void>>();
const writeFileMock = jest.fn<(filePath: string, data: Buffer) => Promise<void>>();
const resolveStoragePathMock = jest.fn<(key: string) => string>();
const infoMock = jest.fn();
const warnMock = jest.fn();

jest.unstable_mockModule("node:fs", () => ({
  default: {
    createReadStream: createReadStreamMock,
  },
}));

jest.unstable_mockModule("node:fs/promises", () => ({
  default: {
    unlink: unlinkMock,
    access: accessMock,
    readFile: readFileMock,
    mkdir: mkdirMock,
    writeFile: writeFileMock,
  },
}));

jest.unstable_mockModule("../../config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
  },
}));

jest.unstable_mockModule("./utils/storageService.utils.js", () => ({
  resolveStoragePath: resolveStoragePathMock,
  STORAGE_CONSTANTS: {
    MODULE: "storage",
    FILE_NOT_FOUND_ERRNO: "ENOENT",
  },
}));

const { StorageService } = await import("./storageService.js");

describe("storageService", () => {
  const service = new StorageService();

  beforeEach(() => {
    createReadStreamMock.mockReset();
    unlinkMock.mockReset();
    accessMock.mockReset();
    readFileMock.mockReset();
    mkdirMock.mockReset();
    writeFileMock.mockReset();
    resolveStoragePathMock.mockReset();
    infoMock.mockReset();
    warnMock.mockReset();
  });

  it("resolves keys into absolute paths and creates read streams", () => {
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    createReadStreamMock.mockReturnValue("stream-token");

    expect(service.resolveAbsolutePath("docs/file.pdf")).toBe("C:/uploads/file.pdf");
    expect(service.createReadStream("docs/file.pdf")).toBe("stream-token");
    expect(resolveStoragePathMock).toHaveBeenCalledWith("docs/file.pdf");
    expect(createReadStreamMock).toHaveBeenCalledWith("C:/uploads/file.pdf");
  });

  it("deletes files and logs success", async () => {
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    unlinkMock.mockResolvedValue(undefined);

    await expect(service.delete("docs/file.pdf")).resolves.toBeUndefined();
    expect(unlinkMock).toHaveBeenCalledWith("C:/uploads/file.pdf");
    expect(infoMock).toHaveBeenCalledWith("File deleted", {
      module: "storage",
      key: "docs/file.pdf",
    });
  });

  it("skips missing files during delete", async () => {
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    unlinkMock.mockRejectedValue({ code: "ENOENT" });

    await expect(service.delete("docs/file.pdf")).resolves.toBeUndefined();
    expect(warnMock).toHaveBeenCalledWith("File not found during delete, skipping", {
      module: "storage",
      key: "docs/file.pdf",
    });
  });

  it("rethrows unexpected delete failures", async () => {
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    const error = Object.assign(new Error("disk failure"), { code: "EACCES" });
    unlinkMock.mockRejectedValue(error);

    await expect(service.delete("docs/file.pdf")).rejects.toThrow("disk failure");
  });

  it("checks existence and reads file content", async () => {
    const buffer = Buffer.from("hello");
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    accessMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue(buffer);

    await expect(service.exists("docs/file.pdf")).resolves.toBe(true);
    await expect(service.read("docs/file.pdf")).resolves.toBe(buffer);
  });

  it("returns false when a file does not exist", async () => {
    resolveStoragePathMock.mockReturnValue("C:/uploads/file.pdf");
    accessMock.mockRejectedValue(new Error("missing"));

    await expect(service.exists("docs/file.pdf")).resolves.toBe(false);
  });

  it("saves files under the resolved path and logs success", async () => {
    const buffer = Buffer.from("payload");
    resolveStoragePathMock.mockReturnValue("C:/uploads/patients/docs/file.pdf");
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);

    await expect(service.save("patients/docs/file.pdf", buffer)).resolves.toBe(
      "patients/docs/file.pdf",
    );
    expect(mkdirMock).toHaveBeenCalledWith("C:/uploads/patients/docs", {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      "C:/uploads/patients/docs/file.pdf",
      buffer,
    );
    expect(infoMock).toHaveBeenCalledWith("File saved", {
      module: "storage",
      key: "patients/docs/file.pdf",
    });
  });
});
