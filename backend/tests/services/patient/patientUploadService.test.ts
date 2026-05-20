import { PATIENT_STORAGE } from "../../../src/constants/patient.constants.js";
import { jest } from "@jest/globals";

const uploadPatientPhotoMock = jest.fn<(...args: any[]) => Promise<string>>();
const uploadDocumentMock = jest.fn<(...args: any[]) => Promise<any>>();
const sanitizeUploadedFileNameMock = jest.fn<(name: string, fallback: string) => string>();
const requireUploadedFileMock = jest.fn<(file?: Express.Multer.File) => Express.Multer.File>();

jest.unstable_mockModule("../../../src/services/patient/index.js", () => ({
  patientService: {
    uploadPatientPhoto: uploadPatientPhotoMock,
    uploadDocument: uploadDocumentMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/uploadFile.utils.js", () => ({
  sanitizeUploadedFileName: sanitizeUploadedFileNameMock,
}));

jest.unstable_mockModule(
  "../../../src/services/patient/utils/patientUploadService.utils.js",
  () => ({
    requireUploadedFile: requireUploadedFileMock,
  }),
);

const { PatientUploadService } = await import(
  "../../../src/services/patient/patientUploadService.js"
);

describe("PatientUploadService", () => {
  const service = new PatientUploadService();

  beforeEach(() => {
    uploadPatientPhotoMock.mockReset();
    uploadDocumentMock.mockReset();
    sanitizeUploadedFileNameMock.mockReset();
    requireUploadedFileMock.mockReset();
  });

  it("uploads patient photos using the validated file contents", async () => {
    const file = {
      buffer: Buffer.from("photo"),
      originalname: "photo.png",
    } as Express.Multer.File;
    requireUploadedFileMock.mockReturnValue(file);
    uploadPatientPhotoMock.mockResolvedValue("stored-photo.png");

    await expect(
      service.uploadPatientPhoto({
        patientId: "patient-1",
        userId: "user-1",
        file,
      }),
    ).resolves.toBe("stored-photo.png");

    expect(requireUploadedFileMock).toHaveBeenCalledWith(file);
    expect(uploadPatientPhotoMock).toHaveBeenCalledWith(
      "patient-1",
      file.buffer,
      "photo.png",
      "user-1",
    );
  });

  it("uploads documents using the sanitized file name", async () => {
    const file = {
      buffer: Buffer.from("document"),
      originalname: "report.pdf",
    } as Express.Multer.File;
    requireUploadedFileMock.mockReturnValue(file);
    sanitizeUploadedFileNameMock.mockReturnValue("sanitized-report.pdf");
    uploadDocumentMock.mockResolvedValue({ id: "doc-1" });

    await expect(
      service.uploadDocument({
        dto: { caseId: "case-1" } as never,
        userId: "user-1",
        file,
      }),
    ).resolves.toEqual({ id: "doc-1" });

    expect(sanitizeUploadedFileNameMock).toHaveBeenCalledWith(
      "report.pdf",
      PATIENT_STORAGE.DEFAULT_DOCUMENT_FILE_NAME,
    );
    expect(uploadDocumentMock).toHaveBeenCalledWith(
      { caseId: "case-1" },
      file.buffer,
      "sanitized-report.pdf",
      "user-1",
    );
  });
});
