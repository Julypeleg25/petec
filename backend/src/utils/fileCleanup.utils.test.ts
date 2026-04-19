import { jest } from "@jest/globals";

const rmMock = jest.fn<
  (filePath: string, options: { force: boolean }) => Promise<void>
>();
const warnMock = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({
  rm: rmMock,
}));

jest.unstable_mockModule("../config/logger.js", () => ({
  logger: {
    warn: warnMock,
  },
}));

const { cleanupFile } = await import("./fileCleanup.utils.js");

const flushPromises = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

describe("fileCleanup.utils", () => {
  afterEach(() => {
    rmMock.mockReset();
    warnMock.mockReset();
  });

  it("deletes the file with force enabled", async () => {
    rmMock.mockResolvedValue(undefined);

    cleanupFile("C:/tmp/report.pdf");
    await flushPromises();

    expect(rmMock).toHaveBeenCalledWith("C:/tmp/report.pdf", { force: true });
    expect(warnMock).not.toHaveBeenCalled();
  });

  it("logs a warning when file cleanup fails", async () => {
    const error = new Error("disk error");
    rmMock.mockRejectedValue(error);

    cleanupFile("C:/tmp/report.pdf", { reason: "rollback" });
    await flushPromises();

    expect(warnMock).toHaveBeenCalledWith("Failed to delete file", {
      file_path: "C:/tmp/report.pdf",
      reason: "rollback",
      error,
    });
  });
});
