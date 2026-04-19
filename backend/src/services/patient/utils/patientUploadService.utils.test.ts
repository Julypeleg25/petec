import { jest } from "@jest/globals";
import { BadRequestError } from "../../../constants/error.constants.js";

const deleteMock = jest.fn<(storageKey: string) => Promise<void>>();

jest.unstable_mockModule("../../storage/index.js", () => ({
  storageService: {
    delete: deleteMock,
  },
}));

const {
  requireUploadedFile,
  withUploadedFileRollback,
} = await import("./patientUploadService.utils.js");

describe("patientUploadService.utils", () => {
  afterEach(() => {
    deleteMock.mockReset();
  });

  it("requires an uploaded file", () => {
    const file = { originalname: "report.pdf" } as Express.Multer.File;

    expect(requireUploadedFile(file)).toBe(file);
    expect(() => requireUploadedFile(undefined)).toThrow(BadRequestError);
  });

  it("returns the operation result when the operation succeeds", async () => {
    await expect(
      withUploadedFileRollback("storage/key", async () => "done"),
    ).resolves.toBe("done");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("rolls back the uploaded file when the operation fails", async () => {
    const error = new Error("save failed");
    deleteMock.mockResolvedValue(undefined);

    await expect(
      withUploadedFileRollback("storage/key", async () => {
        throw error;
      }),
    ).rejects.toThrow(error);

    expect(deleteMock).toHaveBeenCalledWith("storage/key");
  });

  it("swallows rollback cleanup failures and rethrows the original error", async () => {
    deleteMock.mockRejectedValue(new Error("delete failed"));

    await expect(
      withUploadedFileRollback("storage/key", async () => {
        throw new Error("save failed");
      }),
    ).rejects.toThrow("save failed");
  });
});
