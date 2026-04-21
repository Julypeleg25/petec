import { jest } from "@jest/globals";
import {
  BadRequestError,
  NotFoundError,
} from "../../../src/constants/error.constants.js";

const startSessionMock = jest.fn<() => Promise<any>>();

const patientRepositoryMocks = {
  findById: jest.fn<(...args: any[]) => Promise<any | null>>(),
  updateById: jest.fn<(...args: any[]) => Promise<any>>(),
  create: jest.fn<(...args: any[]) => Promise<any>>(),
};

const caseRepositoryMocks = {
  findManyLean: jest.fn<(...args: any[]) => Promise<any[]>>(),
  findMany: jest.fn<(...args: any[]) => Promise<any[]>>(),
  updateById: jest.fn<(...args: any[]) => Promise<any>>(),
  create: jest.fn<(...args: any[]) => Promise<any>>(),
  findBySerialId: jest.fn<(...args: any[]) => Promise<any>>(),
};

const masterCaseRepositoryMocks = {
  create: jest.fn<(...args: any[]) => Promise<any>>(),
  addCaseId: jest.fn<(...args: any[]) => Promise<any>>(),
  updateById: jest.fn<(...args: any[]) => Promise<any>>(),
};

const anesthesiaFormRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any | null>>(),
  upsertByCaseId: jest.fn<(...args: any[]) => Promise<any>>(),
};

const documentRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any[]>>(),
  create: jest.fn<(...args: any[]) => Promise<any>>(),
  findById: jest.fn<(...args: any[]) => Promise<any | null>>(),
  deleteById: jest.fn<(...args: any[]) => Promise<void>>(),
};

const patientMedicineRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any[]>>(),
};

const auditLogMock = jest.fn<(...args: any[]) => Promise<void>>();

const storageServiceMocks = {
  delete: jest.fn<(...args: any[]) => Promise<void>>(),
  exists: jest.fn<(...args: any[]) => Promise<boolean>>(),
  createReadStream: jest.fn<(key: string) => any>(),
};

const caseGridServiceMocks = {
  saveGrid: jest.fn<(...args: any[]) => Promise<void>>(),
};

const infoMock = jest.fn<(...args: any[]) => void>();
const warnMock = jest.fn<(...args: any[]) => void>();

const uploadToCloudinaryMock = jest.fn<(...args: any[]) => Promise<any>>();
const deleteFromCloudinaryMock = jest.fn<(...args: any[]) => Promise<void>>();

const toAnesthesiaFormDTOMock = jest.fn<(value: any) => any>();
const toCaseDetailsResponseDTOMock = jest.fn<(value: any) => any>();
const withMasterCaseDetailsMock = jest.fn<(value: any, master: any) => any>();
const toPatientDocumentResponseDTOMock = jest.fn<(value: any) => any>();
const toReleasePatientDataResponseDTOMock = jest.fn<
  (...args: any[]) => any
>();

const isPhotoStorageKeyMock = jest.fn<(value: string) => boolean>();
const mapCaseToChartsDataResponseMock = jest.fn<(value: any) => any>();
const mapCaseToDailyPlanDetailMock = jest.fn<(value: any) => any>();
const mapRelatedCasesToMasterCaseDetailsMock = jest.fn<(value: any) => any>();
const toPhotoContentTypeMock = jest.fn<(value: string) => string>();

const toObjectIdMock = jest.fn<(value: string) => any>();
const toPatientPhotoUrlMock = jest.fn<(...args: any[]) => string | undefined>();
const toCanonicalJerusalemDateMock = jest.fn<(value: any) => Date | undefined>();
const toDateInputStringMock = jest.fn<(value: any) => string | undefined>();
const mapNewPatientDtoToPatientDataMock = jest.fn<(value: any) => any>();
const mapEditDtoToPatientUpdateMock = jest.fn<(value: any) => any>();
const mapEditDtoToCaseUpdateMock = jest.fn<(value: any) => any>();
const mapNewPatientDtoToCaseDataMock = jest.fn<(value: any) => any>();
const mapGridDtoToRowsMock = jest.fn<(value: any) => any>();
const mapReleaseMedicineToDataMock = jest.fn<(value: any) => any>();
const mapUploadDocumentToDataMock = jest.fn<(...args: any[]) => any>();

const getCaseByIdOrThrowMock = jest.fn<(...args: any[]) => Promise<any>>();
const getCaseByIdPopulatedOrThrowMock = jest.fn<(...args: any[]) => Promise<any>>();
const getCaseBySerialIdOrThrowMock = jest.fn<(...args: any[]) => Promise<any>>();
const resolveMasterCaseBySerialPrefixMock = jest.fn<
  (...args: any[]) => Promise<any>
>();
const hasCaseWeightChangedMock = jest.fn<(left: any, right: any) => boolean>();
const recalculateCaseGridMedicationDosesMock = jest.fn<
  (...args: any[]) => any
>();
const buildCalendarMonthResponseMock = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("mongoose", () => ({
  default: {
    startSession: startSessionMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  patientRepository: patientRepositoryMocks,
  caseRepository: caseRepositoryMocks,
  masterCaseRepository: masterCaseRepositoryMocks,
  anesthesiaFormRepository: anesthesiaFormRepositoryMocks,
  documentRepository: documentRepositoryMocks,
  patientMedicineRepository: patientMedicineRepositoryMocks,
}));

jest.unstable_mockModule("../../../src/repositories/audit/index.js", () => ({
  auditRepository: {
    log: auditLogMock,
  },
}));

jest.unstable_mockModule("../../../src/services/storage/index.js", () => ({
  storageService: storageServiceMocks,
}));

jest.unstable_mockModule("../../../src/services/patient/index.js", () => ({
  caseGridService: caseGridServiceMocks,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/cloudinary.utils.js", () => ({
  uploadToCloudinary: uploadToCloudinaryMock,
  deleteFromCloudinary: deleteFromCloudinaryMock,
}));

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.response.mappers.js",
  () => ({
    toAnesthesiaFormDTO: toAnesthesiaFormDTOMock,
    toCaseDetailsResponseDTO: toCaseDetailsResponseDTOMock,
    withMasterCaseDetails: withMasterCaseDetailsMock,
    toPatientDocumentResponseDTO: toPatientDocumentResponseDTOMock,
    toReleasePatientDataResponseDTO: toReleasePatientDataResponseDTOMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.service.mappers.js",
  () => ({
    isPhotoStorageKey: isPhotoStorageKeyMock,
    mapCaseToChartsDataResponse: mapCaseToChartsDataResponseMock,
    mapCaseToDailyPlanDetail: mapCaseToDailyPlanDetailMock,
    mapRelatedCasesToMasterCaseDetails: mapRelatedCasesToMasterCaseDetailsMock,
    toPhotoContentType: toPhotoContentTypeMock,
  }),
);

jest.unstable_mockModule("../../../src/utils/objectId.utils.js", () => ({
  toObjectId: toObjectIdMock,
}));

jest.unstable_mockModule("../../../src/utils/patientPhoto.utils.js", () => ({
  toPatientPhotoUrl: toPatientPhotoUrlMock,
}));

jest.unstable_mockModule(
  "../../../src/mappers/common/common.mappers.utils.js",
  () => ({
    toCanonicalJerusalemDate: toCanonicalJerusalemDateMock,
    toDateInputString: toDateInputStringMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.patient-data.mappers.js",
  () => ({
    mapNewPatientDtoToPatientData: mapNewPatientDtoToPatientDataMock,
    mapEditDtoToPatientUpdate: mapEditDtoToPatientUpdateMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.case-data.mappers.js",
  () => ({
    mapEditDtoToCaseUpdate: mapEditDtoToCaseUpdateMock,
    mapNewPatientDtoToCaseData: mapNewPatientDtoToCaseDataMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.case-grid.request.mappers.js",
  () => ({
    mapGridDtoToRows: mapGridDtoToRowsMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/mappers/patient/patient.release-document.mappers.js",
  () => ({
    mapReleaseMedicineToData: mapReleaseMedicineToDataMock,
    mapUploadDocumentToData: mapUploadDocumentToDataMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/services/patient/utils/patientService.utils.js",
  () => ({
    ensureDedicatedPatientForCase: jest.fn(),
    getCaseByIdOrThrow: getCaseByIdOrThrowMock,
    getCaseByIdPopulatedOrThrow: getCaseByIdPopulatedOrThrowMock,
    getCaseBySerialIdOrThrow: getCaseBySerialIdOrThrowMock,
    resolveMasterCaseBySerialPrefix: resolveMasterCaseBySerialPrefixMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/services/patient/utils/caseWeightDose.utils.js",
  () => ({
    hasCaseWeightChanged: hasCaseWeightChangedMock,
    recalculateCaseGridMedicationDoses: recalculateCaseGridMedicationDosesMock,
  }),
);

jest.unstable_mockModule(
  "../../../src/services/patient/utils/patientCalendar.utils.js",
  () => ({
    buildCalendarMonthResponse: buildCalendarMonthResponseMock,
  }),
);

const { PatientService } = await import(
  "../../../src/services/patient/patientService.js"
);

const createSession = () => ({
  withTransaction: jest.fn(async (callback: () => Promise<unknown>) => callback()),
  endSession: jest.fn(async () => undefined),
});

const createDoc = (data: any) => ({
  _id: data._id ?? "doc-1",
  patientId: data.patientId,
  photoName: data.photoName,
  photoPublicId: data.photoPublicId,
  storageKey: data.storageKey,
  fileName: data.fileName,
  toObject: jest.fn(() => data),
});

describe("PatientService lower-slice", () => {
  const service = new PatientService();

  beforeEach(() => {
    startSessionMock.mockReset();
    for (const group of [
      patientRepositoryMocks,
      caseRepositoryMocks,
      masterCaseRepositoryMocks,
      anesthesiaFormRepositoryMocks,
      documentRepositoryMocks,
      patientMedicineRepositoryMocks,
      storageServiceMocks,
      caseGridServiceMocks,
    ]) {
      for (const mockFn of Object.values(group)) {
        mockFn.mockReset();
      }
    }
    auditLogMock.mockReset();
    infoMock.mockReset();
    warnMock.mockReset();
    uploadToCloudinaryMock.mockReset();
    deleteFromCloudinaryMock.mockReset();
    toAnesthesiaFormDTOMock.mockReset();
    toCaseDetailsResponseDTOMock.mockReset();
    withMasterCaseDetailsMock.mockReset();
    toPatientDocumentResponseDTOMock.mockReset();
    toReleasePatientDataResponseDTOMock.mockReset();
    isPhotoStorageKeyMock.mockReset();
    mapCaseToChartsDataResponseMock.mockReset();
    mapCaseToDailyPlanDetailMock.mockReset();
    mapRelatedCasesToMasterCaseDetailsMock.mockReset();
    toPhotoContentTypeMock.mockReset();
    toObjectIdMock.mockReset();
    toPatientPhotoUrlMock.mockReset();
    toCanonicalJerusalemDateMock.mockReset();
    toDateInputStringMock.mockReset();
    mapNewPatientDtoToPatientDataMock.mockReset();
    mapEditDtoToPatientUpdateMock.mockReset();
    mapEditDtoToCaseUpdateMock.mockReset();
    mapNewPatientDtoToCaseDataMock.mockReset();
    mapGridDtoToRowsMock.mockReset();
    mapReleaseMedicineToDataMock.mockReset();
    mapUploadDocumentToDataMock.mockReset();
    getCaseByIdOrThrowMock.mockReset();
    getCaseByIdPopulatedOrThrowMock.mockReset();
    getCaseBySerialIdOrThrowMock.mockReset();
    resolveMasterCaseBySerialPrefixMock.mockReset();
    hasCaseWeightChangedMock.mockReset();
    recalculateCaseGridMedicationDosesMock.mockReset();
    buildCalendarMonthResponseMock.mockReset();
  });

  it("returns mapped case documents", async () => {
    const caseDoc = createDoc({ _id: "case-1" });
    const docA = createDoc({ _id: "doc-1" });
    const docB = createDoc({ _id: "doc-2" });
    getCaseByIdOrThrowMock.mockResolvedValue(caseDoc);
    documentRepositoryMocks.findByCaseId.mockResolvedValue([docA, docB]);
    toPatientDocumentResponseDTOMock
      .mockReturnValueOnce({ id: "dto-1" })
      .mockReturnValueOnce({ id: "dto-2" });

    await expect(service.getCaseDocuments("case-1")).resolves.toEqual([
      { id: "dto-1" },
      { id: "dto-2" },
    ]);
  });

  it("rejects document uploads when the case does not belong to the patient", async () => {
    getCaseByIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      patientId: { toString: () => "patient-x" },
    });

    await expect(
      service.uploadDocument(
        { caseId: "case-1", patientId: "patient-1" } as never,
        Buffer.from("file"),
        "report.pdf",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("uploads documents, warns on audit failures, and returns the mapped response", async () => {
    const existingCase = {
      _id: "case-1",
      patientId: { toString: () => "patient-1" },
    };
    const createdDoc = createDoc({ _id: { toString: () => "doc-1" } });
    getCaseByIdOrThrowMock.mockResolvedValue(existingCase);
    uploadToCloudinaryMock.mockResolvedValue({
      secureUrl: "https://cdn.example.com/report.pdf",
      publicId: "cloud-1",
    });
    mapUploadDocumentToDataMock.mockReturnValue({ mapped: true });
    documentRepositoryMocks.create.mockResolvedValue(createdDoc);
    auditLogMock.mockRejectedValue(new Error("audit failed"));
    toPatientDocumentResponseDTOMock.mockReturnValue({ id: "dto-1" });

    await expect(
      service.uploadDocument(
        { caseId: "case-1", patientId: "patient-1" } as never,
        Buffer.from("file"),
        "report.pdf",
        "user-1",
      ),
    ).resolves.toEqual({ id: "dto-1" });

    expect(uploadToCloudinaryMock).toHaveBeenCalledWith({
      buffer: expect.any(Buffer),
      originalName: "report.pdf",
      folder: "patients/documents",
      fallbackBaseName: "document",
    });
    expect(mapUploadDocumentToDataMock).toHaveBeenCalledWith(
      { caseId: "case-1", patientId: "patient-1" },
      "https://cdn.example.com/report.pdf",
      "cloud-1",
      "report.pdf",
      "user-1",
      "case-1",
    );
    expect(warnMock).toHaveBeenCalledWith("Document upload audit log failed", {
      module: "patient",
      event: "patient_document_upload_audit_failed",
      user_id: "user-1",
      patient_id: "patient-1",
      error: expect.any(Error),
    });
    expect(infoMock).toHaveBeenCalledWith("Document uploaded", {
      module: "patient",
      event: "patient_document_uploaded",
      user_id: "user-1",
      doc_id: "doc-1",
      case_id: "case-1",
      patient_id: "patient-1",
    });
  });

  it("rejects patient photo uploads for missing patients", async () => {
    patientRepositoryMocks.findById.mockResolvedValue(null);

    await expect(
      service.uploadPatientPhoto(
        "patient-1",
        Buffer.from("photo"),
        "photo.png",
        "user-1",
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("uploads patient photos, cleans up old cloudinary photos, and tolerates warn paths", async () => {
    const patient = {
      _id: { toString: () => "patient-1" },
      photoName: "http://old-photo.example.com/p.png",
      photoPublicId: "old-photo-id",
    };
    patientRepositoryMocks.findById.mockResolvedValue(patient);
    uploadToCloudinaryMock.mockResolvedValue({
      secureUrl: "patients/photos/new-photo.png",
      publicId: "new-photo-id",
    });
    patientRepositoryMocks.updateById.mockResolvedValue(undefined);
    deleteFromCloudinaryMock.mockRejectedValue(new Error("delete failed"));
    auditLogMock.mockRejectedValue(new Error("audit failed"));
    toPatientPhotoUrlMock.mockReturnValue("/patients/patient-1/photo?v=1");

    await expect(
      service.uploadPatientPhoto(
        "patient-1",
        Buffer.from("photo"),
        "photo.png",
        "user-1",
      ),
    ).resolves.toBe("/patients/patient-1/photo?v=1");

    expect(patientRepositoryMocks.updateById).toHaveBeenCalledWith(patient._id, {
      $set: {
        photoName: "patients/photos/new-photo.png",
        photoPublicId: "new-photo-id",
      },
    });
    expect(deleteFromCloudinaryMock).toHaveBeenCalledWith("old-photo-id");
    expect(warnMock).toHaveBeenCalledWith(
      "Previous patient photo delete from Cloudinary failed",
      expect.objectContaining({
        module: "patient",
        event: "patient_photo_previous_delete_failed",
        patient_id: "patient-1",
      }),
    );
    expect(warnMock).toHaveBeenCalledWith(
      "Patient photo audit log failed",
      expect.objectContaining({
        module: "patient",
        event: "patient_photo_audit_failed",
        user_id: "user-1",
        patient_id: "patient-1",
      }),
    );
    expect(infoMock).toHaveBeenCalledWith("Patient photo updated", {
      module: "patient",
      event: "patient_photo_updated",
      user_id: "user-1",
      patient_id: "patient-1",
    });
  });

  it("falls back to the uploaded asset url when a photo route cannot be built", async () => {
    patientRepositoryMocks.findById.mockResolvedValue({
      _id: { toString: () => "patient-1" },
      photoName: undefined,
      photoPublicId: undefined,
    });
    uploadToCloudinaryMock.mockResolvedValue({
      secureUrl: "patients/photos/new-photo.png",
      publicId: "new-photo-id",
    });
    patientRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);
    toPatientPhotoUrlMock.mockReturnValue(undefined);

    await expect(
      service.uploadPatientPhoto(
        "patient-1",
        Buffer.from("photo"),
        "photo.png",
        "user-1",
      ),
    ).resolves.toBe("patients/photos/new-photo.png");
  });

  it("guards photo streaming for missing patients, missing keys, external urls, and missing files", async () => {
    patientRepositoryMocks.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ photoName: "" })
      .mockResolvedValueOnce({ photoName: "http://cdn.example.com/p.png" })
      .mockResolvedValueOnce({ photoName: "patients/photos/photo.png" });
    isPhotoStorageKeyMock.mockReturnValue(true);
    storageServiceMocks.exists.mockResolvedValue(false);

    await expect(service.getPatientPhotoStream("patient-1")).rejects.toThrow(
      "Patient not found",
    );
    await expect(service.getPatientPhotoStream("patient-1")).rejects.toThrow(
      "Patient photo not found",
    );
    await expect(service.getPatientPhotoStream("patient-1")).rejects.toThrow(
      "Patient photo is hosted externally",
    );
    await expect(service.getPatientPhotoStream("patient-1")).rejects.toThrow(
      "Patient photo not found",
    );
  });

  it("returns a patient photo stream when the stored key exists locally", async () => {
    const stream = { tag: "stream" };
    patientRepositoryMocks.findById.mockResolvedValue({
      photoName: "patients/photos/photo.png",
    });
    isPhotoStorageKeyMock.mockReturnValue(true);
    storageServiceMocks.exists.mockResolvedValue(true);
    storageServiceMocks.createReadStream.mockReturnValue(stream);
    toPhotoContentTypeMock.mockReturnValue("image/png");

    await expect(service.getPatientPhotoStream("patient-1")).resolves.toEqual({
      stream,
      contentType: "image/png",
    });
  });

  it("deletes cloudinary-hosted documents and logs the deletion", async () => {
    documentRepositoryMocks.findById.mockResolvedValue({
      storageKey: "http://cdn.example.com/doc.pdf",
      cloudinaryPublicId: "cloud-1",
      fileName: "doc.pdf",
      patientId: { toString: () => "patient-1" },
    });
    deleteFromCloudinaryMock.mockResolvedValue(undefined);
    documentRepositoryMocks.deleteById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(service.deleteDocument("doc-1", "user-1")).resolves.toBeUndefined();

    expect(deleteFromCloudinaryMock).toHaveBeenCalledWith("cloud-1");
    expect(documentRepositoryMocks.deleteById).toHaveBeenCalledWith("doc-1");
    expect(infoMock).toHaveBeenCalledWith("Document deleted", {
      module: "patient",
      event: "patient_document_deleted",
      user_id: "user-1",
      doc_id: "doc-1",
      patient_id: "patient-1",
    });
  });

  it("deletes locally stored documents through storage", async () => {
    documentRepositoryMocks.findById.mockResolvedValue({
      storageKey: "patients/documents/doc.pdf",
      fileName: "doc.pdf",
      patientId: { toString: () => "patient-1" },
    });
    storageServiceMocks.delete.mockResolvedValue(undefined);
    documentRepositoryMocks.deleteById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(service.deleteDocument("doc-1", "user-1")).resolves.toBeUndefined();

    expect(storageServiceMocks.delete).toHaveBeenCalledWith(
      "patients/documents/doc.pdf",
    );
  });

  it("rejects deleting missing documents", async () => {
    documentRepositoryMocks.findById.mockResolvedValue(null);

    await expect(service.deleteDocument("missing", "user-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("returns null or mapped DTOs for anesthesia forms", async () => {
    getCaseByIdPopulatedOrThrowMock.mockResolvedValue({ _id: "case-1" });
    anesthesiaFormRepositoryMocks.findByCaseId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createDoc({ _id: "form-1", notes: "stable" }));
    toAnesthesiaFormDTOMock.mockReturnValue({ notes: "stable" });

    await expect(service.getAnesthesiaForm("case-1")).resolves.toBeNull();
    await expect(service.getAnesthesiaForm("case-1")).resolves.toEqual({
      notes: "stable",
    });
  });

  it("upserts anesthesia forms in a transaction and ends the session", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseByIdOrThrowMock.mockResolvedValue({ _id: "case-1" });
    toObjectIdMock.mockReturnValue("object-user-1");
    anesthesiaFormRepositoryMocks.upsertByCaseId.mockResolvedValue(
      createDoc({ _id: "form-1", notes: "stable" }),
    );
    auditLogMock.mockResolvedValue(undefined);
    toAnesthesiaFormDTOMock.mockReturnValue({ notes: "stable" });

    await expect(
      service.upsertAnesthesiaForm(
        "case-1",
        { caseId: "ignored", notes: "stable" } as never,
        "user-1",
      ),
    ).resolves.toEqual({ notes: "stable" });

    expect(anesthesiaFormRepositoryMocks.upsertByCaseId).toHaveBeenCalledWith(
      "case-1",
      {
        notes: "stable",
        updatedByUserId: "object-user-1",
      },
      session,
    );
    expect(auditLogMock).toHaveBeenCalledWith(
      "Patient Management",
      "Anesthesia form updated",
      "Case",
      "case-1",
      "user-1",
      session,
    );
    expect(session.endSession).toHaveBeenCalled();
  });

  it("returns release patient data from the case and medicine docs", async () => {
    const caseDoc = createDoc({ _id: "case-1", serialId: "A-1" });
    const medDoc = createDoc({ _id: "med-1", name: "IV" });
    getCaseByIdOrThrowMock.mockResolvedValue(caseDoc);
    patientMedicineRepositoryMocks.findByCaseId.mockResolvedValue([medDoc]);
    toReleasePatientDataResponseDTOMock.mockReturnValue({ medicines: [] });

    await expect(service.getReleasePatientData("case-1")).resolves.toEqual({
      medicines: [],
    });

    expect(toReleasePatientDataResponseDTOMock).toHaveBeenCalledWith(
      caseDoc.toObject(),
      [medDoc.toObject()],
    );
  });

  it("returns chart data from the mapped case", async () => {
    const caseDoc = createDoc({ _id: "case-1" });
    getCaseByIdOrThrowMock.mockResolvedValue(caseDoc);
    mapCaseToChartsDataResponseMock.mockReturnValue({ series: [] });

    await expect(service.getChartsData("case-1")).resolves.toEqual({
      series: [],
    });
  });

  it("loads the calendar month and delegates month response construction", async () => {
    const leanCases = [{ id: "case-1" }];
    caseRepositoryMocks.findManyLean.mockResolvedValue(leanCases);
    buildCalendarMonthResponseMock.mockReturnValue({ year: 2026, month: 4, days: [] });

    await expect(service.getCalendarMonth(2026, 4)).resolves.toEqual({
      year: 2026,
      month: 4,
      days: [],
    });

    expect(caseRepositoryMocks.findManyLean).toHaveBeenCalledWith(
      expect.objectContaining({
        isDeleted: false,
        $or: expect.any(Array),
      }),
      expect.objectContaining({
        sort: {
          "dates.procedureDate": 1,
          serialId: 1,
        },
        populate: ["patientId"],
      }),
    );
    expect(buildCalendarMonthResponseMock).toHaveBeenCalledWith(
      leanCases,
      2026,
      4,
    );
  });

  it("returns the daily plan sorted by master case id and serial id", async () => {
    const caseA = createDoc({ _id: "case-a" });
    const caseB = createDoc({ _id: "case-b" });
    const caseC = createDoc({ _id: "case-c" });
    caseRepositoryMocks.findMany.mockResolvedValue([caseA, caseB, caseC]);
    mapCaseToDailyPlanDetailMock
      .mockReturnValueOnce({ master_case_id: "2", serial_id: "2" })
      .mockReturnValueOnce({ master_case_id: "1", serial_id: "10" })
      .mockReturnValueOnce({ master_case_id: "1", serial_id: "2" });

    await expect(service.getDailyPlan()).resolves.toEqual([
      { master_case_id: "1", serial_id: "2" },
      { master_case_id: "1", serial_id: "10" },
      { master_case_id: "2", serial_id: "2" },
    ]);
  });

  it("updates the daily plan by resolving case ids and serial ids inside a transaction", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseByIdOrThrowMock
      .mockResolvedValueOnce({ _id: "mongo-case-id" })
      .mockResolvedValueOnce({ _id: "fallback-id" });
    getCaseBySerialIdOrThrowMock.mockResolvedValue({ _id: "serial-case-id" });
    caseRepositoryMocks.updateById.mockResolvedValue(undefined);

    await expect(
      service.updateDailyPlan({
        "507f1f77bcf86cd799439011": { comment: "first" },
        fallback: { caseId: "SER-12", comments: "second" },
        noSerial: { comments: "third" },
      } as never),
    ).resolves.toBeUndefined();

    expect(caseRepositoryMocks.updateById).toHaveBeenNthCalledWith(
      1,
      "mongo-case-id",
      {
        $set: {
          dailyPlan: {
            comments: "first",
            updatedAt: expect.any(Date),
          },
        },
      },
      { session },
    );
    expect(caseRepositoryMocks.updateById).toHaveBeenNthCalledWith(
      2,
      "serial-case-id",
      {
        $set: {
          dailyPlan: {
            comments: "second",
            updatedAt: expect.any(Date),
          },
        },
      },
      { session },
    );
    expect(caseRepositoryMocks.updateById).toHaveBeenNthCalledWith(
      3,
      "fallback-id",
      {
        $set: {
          dailyPlan: {
            comments: "third",
            updatedAt: expect.any(Date),
          },
        },
      },
      { session },
    );
    expect(session.endSession).toHaveBeenCalled();
  });
});
