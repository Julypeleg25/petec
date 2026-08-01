import { EventEmitter } from "node:events";
import {
  CalendarMonthResponseDTOSchema,
  CaseDetailsResponseDTOSchema,
  ChartsDataResponseDTOSchema,
  CreateAnesthesiaProcedureFormDTOSchema,
  CreatePatientResponseDTOSchema,
  DailyPlanDetailListResponseDTOSchema,
  HttpStatus,
  PatientDocumentListResponseDTOSchema,
  PatientDocumentResponseDTOSchema,
  ReleasePatientDataResponseDTOSchema,
  UploadPatientPhotoResponseDTOSchema,
} from "@petec/shared";
import { jest } from "@jest/globals";

const patientServiceMocks = {
  createPatientAndCase: jest.fn<(...args: any[]) => Promise<any>>(),
  editPatientAndCase: jest.fn<(...args: any[]) => Promise<void>>(),
  getCaseDetails: jest.fn<(...args: any[]) => Promise<any>>(),
  releasePatient: jest.fn<(...args: any[]) => Promise<void>>(),
  archivePatientCase: jest.fn<(...args: any[]) => Promise<void>>(),
  deletePatientCase: jest.fn<(...args: any[]) => Promise<void>>(),
  getCaseDocuments: jest.fn<(...args: any[]) => Promise<any>>(),
  deleteDocument: jest.fn<(...args: any[]) => Promise<void>>(),
  getAnesthesiaForm: jest.fn<(...args: any[]) => Promise<any>>(),
  upsertAnesthesiaForm: jest.fn<(...args: any[]) => Promise<any>>(),
  getReleasePatientData: jest.fn<(...args: any[]) => Promise<any>>(),
  getChartsData: jest.fn<(...args: any[]) => Promise<any>>(),
  getDailyPlan: jest.fn<(...args: any[]) => Promise<any>>(),
  getCalendarMonth: jest.fn<(...args: any[]) => Promise<any>>(),
  updateDailyPlan: jest.fn<(...args: any[]) => Promise<void>>(),
  getPatientPhotoStream: jest.fn<(...args: any[]) => Promise<any>>(),
};

const patientUploadServiceMocks = {
  uploadDocument: jest.fn<(...args: any[]) => Promise<any>>(),
  uploadPatientPhoto: jest.fn<(...args: any[]) => Promise<string>>(),
};
const clinicalSummaryServiceMock = {
  generate: jest.fn<(...args: any[]) => Promise<any>>(),
};

const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const sendCreatedMock = jest.fn<(...args: any[]) => void>();
const sendNoContentMock = jest.fn<(...args: any[]) => void>();
const getValidatedBodyMock = jest.fn<(req: any) => any>();
const getValidatedParamsMock = jest.fn<(req: any) => any>();
const getAuthenticatedUserIdMock = jest.fn<(req: any) => string>();

jest.unstable_mockModule("../../src/services/patient/index.js", () => ({
  patientService: patientServiceMocks,
  patientUploadService: patientUploadServiceMocks,
}));
jest.unstable_mockModule("../../src/services/clinicalSummary/index.js", () => ({
  clinicalSummaryService: clinicalSummaryServiceMock,
}));

jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
  sendCreated: sendCreatedMock,
  sendNoContent: sendNoContentMock,
}));

jest.unstable_mockModule("../../src/utils/request.utils.js", () => ({
  getAuthenticatedUserId: getAuthenticatedUserIdMock,
  getValidatedBody: getValidatedBodyMock,
  getValidatedParams: getValidatedParamsMock,
}));

const { PatientController } =
  await import("../../src/controllers/patient/patient.controller.js");

describe("PatientController", () => {
  const controller = new PatientController();
  const res: any = {
    setHeader: jest.fn<(...args: any[]) => void>(),
    status: jest.fn(function mockStatus(this: any) {
      return this;
    }),
  };
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    for (const mockFn of Object.values(patientServiceMocks)) {
      mockFn.mockReset();
    }
    for (const mockFn of Object.values(patientUploadServiceMocks)) {
      mockFn.mockReset();
    }
    sendSuccessMock.mockReset();
    sendCreatedMock.mockReset();
    sendNoContentMock.mockReset();
    getValidatedBodyMock.mockReset();
    getValidatedParamsMock.mockReset();
    getAuthenticatedUserIdMock.mockReset();
    clinicalSummaryServiceMock.generate.mockReset();
    (res.setHeader as any).mockReset();
    (res.status as any).mockReset();
    next.mockReset();
  });

  it("generates a no-store clinical summary for the authenticated user", async () => {
    const result = {
      backgroundAndAdmission: "רקע",
      currentClinicalStatus: "מצב",
      importantChangesAndTrends: [],
      treatmentsAndMedications: [],
      alerts: [],
      missingInformationAndFollowUp: [],
      recordUpdatedThrough: "2026-01-01T00:00:00.000Z",
      inputWasTruncated: false,
    };
    getValidatedParamsMock.mockReturnValue({
      patientId: "507f1f77bcf86cd799439011",
    });
    getValidatedBodyMock.mockReturnValue({});
    getAuthenticatedUserIdMock.mockReturnValue("507f1f77bcf86cd799439012");
    clinicalSummaryServiceMock.generate.mockResolvedValue(result);

    await controller.generateClinicalSummary(
      { params: {}, requestId: "req-summary-1" } as never,
      res,
      next,
    );

    expect(clinicalSummaryServiceMock.generate).toHaveBeenCalledWith({
      patientId: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
      requestedDate: undefined,
      requestId: "req-summary-1",
    });
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      expect.anything(),
    );
  });

  it("creates a patient and case for the authenticated user", async () => {
    const dto = { patientName: "Nina" };
    const result = { caseId: "case-1" };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.createPatientAndCase.mockResolvedValue(result);

    await controller.createPatientAndCase({ body: dto } as never, res, next);

    expect(patientServiceMocks.createPatientAndCase).toHaveBeenCalledWith(
      dto,
      "user-1",
    );
    expect(sendCreatedMock).toHaveBeenCalledWith(
      res,
      result,
      CreatePatientResponseDTOSchema,
    );
  });

  it("edits a patient and case then returns no content", async () => {
    const dto = { caseId: "case-1" };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.editPatientAndCase.mockResolvedValue(undefined);

    await controller.editPatientAndCase({ body: dto } as never, res, next);

    expect(patientServiceMocks.editPatientAndCase).toHaveBeenCalledWith(
      dto,
      "user-1",
    );
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("returns case details with the case details schema", async () => {
    const result = { id: "case-1" };
    getValidatedParamsMock.mockReturnValue({
      caseId: "case-1",
      masterCaseId: "master-1",
    });
    patientServiceMocks.getCaseDetails.mockResolvedValue(result);

    await controller.getCaseDetails({ params: {} } as never, res, next);

    expect(patientServiceMocks.getCaseDetails).toHaveBeenCalledWith(
      "case-1",
      "master-1",
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      CaseDetailsResponseDTOSchema,
    );
  });

  it("releases a patient and returns no content", async () => {
    const dto = { caseId: "case-1" };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.releasePatient.mockResolvedValue(undefined);

    await controller.releasePatient({ body: dto } as never, res, next);

    expect(patientServiceMocks.releasePatient).toHaveBeenCalledWith(
      dto,
      "user-1",
    );
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("archives a patient case using case id and archive flag", async () => {
    const dto = { caseId: "case-1", shouldArchive: true };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.archivePatientCase.mockResolvedValue(undefined);

    await controller.archivePatientCase({ body: dto } as never, res, next);

    expect(patientServiceMocks.archivePatientCase).toHaveBeenCalledWith(
      "case-1",
      true,
      "user-1",
    );
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("deletes a patient case using the authenticated user id", async () => {
    const dto = { caseId: "case-1" };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.deletePatientCase.mockResolvedValue(undefined);

    await controller.deletePatientCase({ body: dto } as never, res, next);

    expect(patientServiceMocks.deletePatientCase).toHaveBeenCalledWith(
      "case-1",
      "user-1",
    );
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("returns case documents", async () => {
    const result = [{ id: "doc-1" }];
    getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
    patientServiceMocks.getCaseDocuments.mockResolvedValue(result);

    await controller.getDocuments({ params: {} } as never, res, next);

    expect(patientServiceMocks.getCaseDocuments).toHaveBeenCalledWith("case-1");
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      PatientDocumentListResponseDTOSchema,
    );
  });

  it("uploads documents through the patient upload service", async () => {
    const dto = { caseId: "case-1" };
    const file = { originalname: "report.pdf" };
    const result = { id: "doc-1" };
    getValidatedBodyMock.mockReturnValue(dto);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientUploadServiceMocks.uploadDocument.mockResolvedValue(result);

    await controller.uploadDocument({ body: dto, file } as never, res, next);

    expect(patientUploadServiceMocks.uploadDocument).toHaveBeenCalledWith({
      dto,
      userId: "user-1",
      file,
    });
    expect(sendCreatedMock).toHaveBeenCalledWith(
      res,
      result,
      PatientDocumentResponseDTOSchema,
    );
  });

  it("deletes documents through the patient service", async () => {
    getValidatedParamsMock.mockReturnValue({ documentId: "doc-1" });
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.deleteDocument.mockResolvedValue(undefined);

    await controller.deleteDocument({ params: {} } as never, res, next);

    expect(patientServiceMocks.deleteDocument).toHaveBeenCalledWith(
      "doc-1",
      "user-1",
    );
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("returns nullable anesthesia forms", async () => {
    const result = null;
    getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
    patientServiceMocks.getAnesthesiaForm.mockResolvedValue(result);

    await controller.getAnesthesiaForm({ params: {} } as never, res, next);

    expect(patientServiceMocks.getAnesthesiaForm).toHaveBeenCalledWith(
      "case-1",
    );
    expect(sendSuccessMock.mock.calls[0]?.[0]).toBe(res);
    expect(sendSuccessMock.mock.calls[0]?.[1]).toBe(result);
    expect(sendSuccessMock.mock.calls[0]?.[2]).toBeTruthy();
  });

  it("upserts anesthesia forms and returns the saved payload", async () => {
    const data = { notes: "stable" };
    const result = { notes: "stable" };
    getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
    getValidatedBodyMock.mockReturnValue(data);
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.upsertAnesthesiaForm.mockResolvedValue(result);

    await controller.upsertAnesthesiaForm(
      { params: {}, body: data } as never,
      res,
      next,
    );

    expect(patientServiceMocks.upsertAnesthesiaForm).toHaveBeenCalledWith(
      "case-1",
      data,
      "user-1",
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      CreateAnesthesiaProcedureFormDTOSchema,
    );
  });

  it("returns release patient data", async () => {
    const result = { releasedBy: "doctor-1" };
    getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
    patientServiceMocks.getReleasePatientData.mockResolvedValue(result);

    await controller.getReleasePatientData({ params: {} } as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      ReleasePatientDataResponseDTOSchema,
    );
  });

  it("returns chart data", async () => {
    const result = { vitals: [] };
    getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
    patientServiceMocks.getChartsData.mockResolvedValue(result);

    await controller.getChartsData({ params: {} } as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      ChartsDataResponseDTOSchema,
    );
  });

  it("returns the daily plan list", async () => {
    const result = [{ id: "plan-1" }];
    patientServiceMocks.getDailyPlan.mockResolvedValue(result);

    await controller.getDailyPlan({} as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      DailyPlanDetailListResponseDTOSchema,
    );
  });

  it("returns calendar month data", async () => {
    const result = { year: 2026, month: 4, days: [] };
    getValidatedParamsMock.mockReturnValue({ year: 2026, month: 4 });
    patientServiceMocks.getCalendarMonth.mockResolvedValue(result);

    await controller.getCalendarMonth({ params: {} } as never, res, next);

    expect(patientServiceMocks.getCalendarMonth).toHaveBeenCalledWith(2026, 4);
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      CalendarMonthResponseDTOSchema,
    );
  });

  it("updates the daily plan and returns no content", async () => {
    const data = { rows: [] };
    getValidatedBodyMock.mockReturnValue(data);
    patientServiceMocks.updateDailyPlan.mockResolvedValue(undefined);

    await controller.updateDailyPlan({ body: data } as never, res, next);

    expect(patientServiceMocks.updateDailyPlan).toHaveBeenCalledWith(data);
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("uploads patient photos and returns the photo name", async () => {
    const file = { originalname: "photo.png" };
    getValidatedParamsMock.mockReturnValue({ patientId: "patient-1" });
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientUploadServiceMocks.uploadPatientPhoto.mockResolvedValue(
      "photo-1.png",
    );

    await controller.uploadPatientPhoto(
      { params: {}, file } as never,
      res,
      next,
    );

    expect(patientUploadServiceMocks.uploadPatientPhoto).toHaveBeenCalledWith({
      patientId: "patient-1",
      userId: "user-1",
      file,
    });
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      { photoName: "photo-1.png" },
      UploadPatientPhotoResponseDTOSchema,
    );
  });

  it("streams patient photos to the response and wires stream errors to next", async () => {
    const stream = new EventEmitter() as EventEmitter & {
      pipe: jest.Mock;
    };
    stream.pipe = jest.fn();

    getValidatedParamsMock.mockReturnValue({ patientId: "patient-1" });
    patientServiceMocks.getPatientPhotoStream.mockResolvedValue({
      contentType: "image/png",
      stream,
    });

    await controller.getPatientPhoto({ params: {} } as never, res, next);

    expect(res.setHeader as any).toHaveBeenNthCalledWith(
      1,
      "Content-Type",
      "image/png",
    );
    expect(res.setHeader as any).toHaveBeenNthCalledWith(
      2,
      "Cache-Control",
      "public, max-age=300",
    );
    expect(res.status as any).toHaveBeenCalledWith(HttpStatus.OK);
    expect(stream.pipe).toHaveBeenCalledWith(res);

    const streamError = new Error("stream failed");
    stream.emit("error", streamError);
    expect(next).toHaveBeenCalledWith(streamError);
  });

  it("forwards service errors to next", async () => {
    const error = new Error("patient failed");
    getValidatedBodyMock.mockReturnValue({ caseId: "case-1" });
    getAuthenticatedUserIdMock.mockReturnValue("user-1");
    patientServiceMocks.releasePatient.mockRejectedValue(error);

    await controller.releasePatient({ body: {} } as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it.each([
    [
      "createPatientAndCase",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({ name: "Nina" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.createPatientAndCase.mockRejectedValue(error);
      },
      () => controller.createPatientAndCase({ body: {} } as never, res, next),
    ],
    [
      "editPatientAndCase",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({ caseId: "case-1" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.editPatientAndCase.mockRejectedValue(error);
      },
      () => controller.editPatientAndCase({ body: {} } as never, res, next),
    ],
    [
      "getCaseDetails",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          caseId: "case-1",
          masterCaseId: "master-1",
        });
        patientServiceMocks.getCaseDetails.mockRejectedValue(error);
      },
      () => controller.getCaseDetails({ params: {} } as never, res, next),
    ],
    [
      "archivePatientCase",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({
          caseId: "case-1",
          shouldArchive: true,
        });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.archivePatientCase.mockRejectedValue(error);
      },
      () => controller.archivePatientCase({ body: {} } as never, res, next),
    ],
    [
      "deletePatientCase",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({ caseId: "case-1" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.deletePatientCase.mockRejectedValue(error);
      },
      () => controller.deletePatientCase({ body: {} } as never, res, next),
    ],
    [
      "getDocuments",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
        patientServiceMocks.getCaseDocuments.mockRejectedValue(error);
      },
      () => controller.getDocuments({ params: {} } as never, res, next),
    ],
    [
      "uploadDocument",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({ caseId: "case-1" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientUploadServiceMocks.uploadDocument.mockRejectedValue(error);
      },
      () =>
        controller.uploadDocument(
          { body: {}, file: { originalname: "report.pdf" } } as never,
          res,
          next,
        ),
    ],
    [
      "deleteDocument",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ documentId: "doc-1" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.deleteDocument.mockRejectedValue(error);
      },
      () => controller.deleteDocument({ params: {} } as never, res, next),
    ],
    [
      "getAnesthesiaForm",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
        patientServiceMocks.getAnesthesiaForm.mockRejectedValue(error);
      },
      () => controller.getAnesthesiaForm({ params: {} } as never, res, next),
    ],
    [
      "upsertAnesthesiaForm",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
        getValidatedBodyMock.mockReturnValue({ notes: "stable" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientServiceMocks.upsertAnesthesiaForm.mockRejectedValue(error);
      },
      () =>
        controller.upsertAnesthesiaForm(
          { params: {}, body: {} } as never,
          res,
          next,
        ),
    ],
    [
      "getReleasePatientData",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
        patientServiceMocks.getReleasePatientData.mockRejectedValue(error);
      },
      () =>
        controller.getReleasePatientData({ params: {} } as never, res, next),
    ],
    [
      "getChartsData",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ caseId: "case-1" });
        patientServiceMocks.getChartsData.mockRejectedValue(error);
      },
      () => controller.getChartsData({ params: {} } as never, res, next),
    ],
    [
      "getDailyPlan",
      (error: Error) => {
        patientServiceMocks.getDailyPlan.mockRejectedValue(error);
      },
      () => controller.getDailyPlan({} as never, res, next),
    ],
    [
      "getCalendarMonth",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ year: 2026, month: 4 });
        patientServiceMocks.getCalendarMonth.mockRejectedValue(error);
      },
      () => controller.getCalendarMonth({ params: {} } as never, res, next),
    ],
    [
      "updateDailyPlan",
      (error: Error) => {
        getValidatedBodyMock.mockReturnValue({ rows: [] });
        patientServiceMocks.updateDailyPlan.mockRejectedValue(error);
      },
      () => controller.updateDailyPlan({ body: {} } as never, res, next),
    ],
    [
      "uploadPatientPhoto",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ patientId: "patient-1" });
        getAuthenticatedUserIdMock.mockReturnValue("user-1");
        patientUploadServiceMocks.uploadPatientPhoto.mockRejectedValue(error);
      },
      () =>
        controller.uploadPatientPhoto(
          { params: {}, file: { originalname: "photo.png" } } as never,
          res,
          next,
        ),
    ],
    [
      "getPatientPhoto",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ patientId: "patient-1" });
        patientServiceMocks.getPatientPhotoStream.mockRejectedValue(error);
      },
      () => controller.getPatientPhoto({ params: {} } as never, res, next),
    ],
  ] as const)(
    "forwards %s failures to next",
    async (_methodName, arrange, invoke) => {
      const error = new Error("controller failed");
      arrange(error);

      await invoke();

      expect(next).toHaveBeenCalledWith(error);
    },
  );
});
