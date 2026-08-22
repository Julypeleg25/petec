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
  release: jest.fn<(...args: any[]) => Promise<any>>(),
  deleteById: jest.fn<(...args: any[]) => Promise<any>>(),
};

const masterCaseRepositoryMocks = {
  create: jest.fn<(...args: any[]) => Promise<any>>(),
  addCaseId: jest.fn<(...args: any[]) => Promise<any>>(),
  updateById: jest.fn<(...args: any[]) => Promise<any>>(),
  removeCaseId: jest.fn<(...args: any[]) => Promise<any>>(),
  findById: jest.fn<(...args: any[]) => Promise<any>>(),
  deleteById: jest.fn<(...args: any[]) => Promise<any>>(),
};

const anesthesiaFormRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any | null>>(),
  upsertByCaseId: jest.fn<(...args: any[]) => Promise<any>>(),
  deleteMany: jest.fn<(...args: any[]) => Promise<any>>(),
};

const documentRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any[]>>(),
  create: jest.fn<(...args: any[]) => Promise<any>>(),
  findById: jest.fn<(...args: any[]) => Promise<any | null>>(),
  deleteById: jest.fn<(...args: any[]) => Promise<void>>(),
  deleteMany: jest.fn<(...args: any[]) => Promise<any>>(),
};

const patientMedicineRepositoryMocks = {
  findByCaseId: jest.fn<(...args: any[]) => Promise<any[]>>(),
  deleteMany: jest.fn<(...args: any[]) => Promise<any>>(),
  create: jest.fn<(...args: any[]) => Promise<any>>(),
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
const ensureDedicatedPatientForCaseMock = jest.fn<(...args: any[]) => Promise<any>>();
const deleteCaseDocumentAssetMock = jest.fn<(...args: any[]) => Promise<any>>();
const getCalendarQueryBoundsMock = jest.fn();
const getTodayProcedureDateFilterMock = jest.fn();
const shouldPersistManualProcedureUnarchiveMock = jest.fn();
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
    deleteCaseDocumentAsset: deleteCaseDocumentAssetMock,
    ensureDedicatedPatientForCase: ensureDedicatedPatientForCaseMock,
    getCaseByIdOrThrow: getCaseByIdOrThrowMock,
    getCaseByIdPopulatedOrThrow: getCaseByIdPopulatedOrThrowMock,
    getCalendarQueryBounds: getCalendarQueryBoundsMock,
    getCaseBySerialIdOrThrow: getCaseBySerialIdOrThrowMock,
    getTodayProcedureDateFilter: getTodayProcedureDateFilterMock,
    resolveMasterCaseBySerialPrefix: resolveMasterCaseBySerialPrefixMock,
    shouldPersistManualProcedureUnarchive: shouldPersistManualProcedureUnarchiveMock,
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
    ensureDedicatedPatientForCaseMock.mockReset();
    deleteCaseDocumentAssetMock.mockReset();
    getCalendarQueryBoundsMock.mockReset();
    getTodayProcedureDateFilterMock.mockReset();
    shouldPersistManualProcedureUnarchiveMock.mockReset();
    resolveMasterCaseBySerialPrefixMock.mockReset();
    hasCaseWeightChangedMock.mockReset();
    recalculateCaseGridMedicationDosesMock.mockReset();
    buildCalendarMonthResponseMock.mockReset();
  });

  it("creates a patient and case under an existing master case", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    caseRepositoryMocks.findBySerialId.mockResolvedValue(null);
    resolveMasterCaseBySerialPrefixMock.mockResolvedValue("master-1");
    mapNewPatientDtoToPatientDataMock.mockReturnValue({ patientMapped: true });
    patientRepositoryMocks.create.mockResolvedValue({ _id: "patient-1" });
    mapNewPatientDtoToCaseDataMock.mockReturnValue({ caseMapped: true });
    caseRepositoryMocks.create.mockResolvedValue({ _id: "case-1" });
    masterCaseRepositoryMocks.addCaseId.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.createPatientAndCase({ caseId: "123-45", name: "Milo" } as never, "user-1"),
    ).resolves.toEqual({
      patientId: "patient-1",
      caseId: "case-1",
      masterCaseId: "master-1",
    });

    expect(mapNewPatientDtoToPatientDataMock).toHaveBeenCalledWith({
      caseId: "123-45",
      name: "Milo",
    });
    expect(mapNewPatientDtoToCaseDataMock).toHaveBeenCalledWith(
      { caseId: "123-45", name: "Milo" },
      "patient-1",
      "master-1",
      "user-1",
    );
    expect(masterCaseRepositoryMocks.addCaseId).toHaveBeenCalledWith(
      "master-1",
      "case-1",
      { session },
    );
    expect(masterCaseRepositoryMocks.create).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(
      "Patient Management",
      "Patient case created: Milo",
      "Patient",
      "patient-1",
      "user-1",
      session,
    );
    expect(session.endSession).toHaveBeenCalled();
  });

  it("creates a new master case when no serial-prefix match exists", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    caseRepositoryMocks.findBySerialId.mockResolvedValue(null);
    resolveMasterCaseBySerialPrefixMock.mockResolvedValue(null);
    mapNewPatientDtoToPatientDataMock.mockReturnValue({ patientMapped: true });
    patientRepositoryMocks.create.mockResolvedValue({ _id: "patient-2" });
    masterCaseRepositoryMocks.create.mockResolvedValue({ _id: "master-2" });
    mapNewPatientDtoToCaseDataMock.mockReturnValue({ caseMapped: true });
    caseRepositoryMocks.create.mockResolvedValue({ _id: "case-2" });
    masterCaseRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.createPatientAndCase({ caseId: "999-1", name: "Luna" } as never, "user-2"),
    ).resolves.toEqual({
      patientId: "patient-2",
      caseId: "case-2",
      masterCaseId: "master-2",
    });

    expect(masterCaseRepositoryMocks.create).toHaveBeenCalledWith(
      { caseIds: [] },
      { session },
    );
    expect(masterCaseRepositoryMocks.updateById).toHaveBeenCalledWith(
      "master-2",
      { $set: { caseIds: ["case-2"] } },
      { session },
    );
    expect(masterCaseRepositoryMocks.addCaseId).not.toHaveBeenCalled();
  });

  it("rejects creating a patient case when the serial id already exists", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    caseRepositoryMocks.findBySerialId.mockResolvedValue({ _id: "existing-case" });

    await expect(
      service.createPatientAndCase(
        { caseId: "123-45", name: "Milo" } as never,
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);

    expect(patientRepositoryMocks.create).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it("edits patient and case data, recalculates grid doses, and persists updates", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    const existingCase = {
      _id: "case-1",
      serialId: "SER-1",
      isArchived: false,
      patientSnapshot: {
        weightKg: 4.2,
      },
      caseDetailsGrid: [{ existing: true }],
    };
    getCaseBySerialIdOrThrowMock.mockResolvedValue(existingCase);
    ensureDedicatedPatientForCaseMock.mockResolvedValue("patient-1");
    patientRepositoryMocks.findById.mockResolvedValue({
      _id: "patient-1",
      name: "Milo",
    });
    mapEditDtoToPatientUpdateMock.mockReturnValue({ name: "Updated Milo" });
    patientRepositoryMocks.updateById.mockResolvedValue(undefined);
    hasCaseWeightChangedMock.mockReturnValue(true);
    mapGridDtoToRowsMock.mockReturnValue([{ draft: true }]);
    recalculateCaseGridMedicationDosesMock.mockResolvedValue([{ final: true }]);
    caseGridServiceMocks.saveGrid.mockResolvedValue(undefined);
    mapEditDtoToCaseUpdateMock.mockReturnValue({ comments: "updated" });
    caseRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.editPatientAndCase(
        {
          caseId: "SER-1",
          patientSnapshot: { weightKg: 5.1 },
          caseDetails: [[{ id: "row-1" }]],
        } as never,
        "user-1",
      ),
    ).resolves.toBeUndefined();

    expect(patientRepositoryMocks.updateById).toHaveBeenCalledWith(
      "patient-1",
      { $set: { name: "Updated Milo" } },
      { session },
    );
    expect(recalculateCaseGridMedicationDosesMock).toHaveBeenCalledWith(
      [{ draft: true }],
      5.1,
      session,
    );
    expect(caseGridServiceMocks.saveGrid).toHaveBeenCalledWith(
      "SER-1",
      [{ final: true }],
      session,
    );
    expect(caseRepositoryMocks.updateById).toHaveBeenCalledWith(
      "case-1",
      { $set: { comments: "updated" } },
      { session },
    );
    expect(auditLogMock).toHaveBeenCalledWith(
      "Patient Management",
      "Patient/case edited: Milo",
      "Case",
      "case-1",
      "user-1",
      session,
    );
  });

  it("rejects editing archived cases", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      serialId: "SER-1",
      isArchived: true,
    });

    await expect(
      service.editPatientAndCase({ caseId: "SER-1" } as never, "user-1"),
    ).rejects.toThrow(BadRequestError);

    expect(patientRepositoryMocks.findById).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it("rejects editing cases when the dedicated patient cannot be found", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      serialId: "SER-1",
      isArchived: false,
      patientSnapshot: {
        weightKg: 4.2,
      },
      caseDetailsGrid: [],
    });
    ensureDedicatedPatientForCaseMock.mockResolvedValue("patient-1");
    patientRepositoryMocks.findById.mockResolvedValue(null);

    await expect(
      service.editPatientAndCase({ caseId: "SER-1" } as never, "user-1"),
    ).rejects.toThrow(NotFoundError);

    expect(session.endSession).toHaveBeenCalled();
  });

  it("reuses the stored grid when weights change without incoming case details", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    const existingCase = {
      _id: "case-1",
      serialId: "SER-1",
      isArchived: false,
      patientSnapshot: {
        weightKg: 4.2,
      },
      caseDetailsGrid: [{ existing: true }],
    };
    getCaseBySerialIdOrThrowMock.mockResolvedValue(existingCase);
    ensureDedicatedPatientForCaseMock.mockResolvedValue("patient-1");
    patientRepositoryMocks.findById.mockResolvedValue({
      _id: "patient-1",
      name: "Milo",
    });
    mapEditDtoToPatientUpdateMock.mockReturnValue({});
    hasCaseWeightChangedMock.mockReturnValue(true);
    recalculateCaseGridMedicationDosesMock.mockResolvedValue([{ final: true }]);
    caseGridServiceMocks.saveGrid.mockResolvedValue(undefined);
    mapEditDtoToCaseUpdateMock.mockReturnValue({});
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.editPatientAndCase(
        {
          caseId: "SER-1",
          patientSnapshot: { weightKg: 5.1 },
        } as never,
        "user-1",
      ),
    ).resolves.toBeUndefined();

    expect(recalculateCaseGridMedicationDosesMock).toHaveBeenCalledWith(
      [{ existing: true }],
      5.1,
      session,
    );
    expect(caseGridServiceMocks.saveGrid).toHaveBeenCalledWith(
      "SER-1",
      [{ final: true }],
      session,
    );
    expect(mapGridDtoToRowsMock).not.toHaveBeenCalled();
  });

  it("loads case details with related master case details when matches exist", async () => {
    const isolatedCase = { _id: "case-1" };
    const populatedCase = {
      masterCaseId: { toString: () => "master-1" },
      toObject: jest.fn(() => ({ serialId: "123-45" })),
    };
    const relatedDoc = createDoc({ _id: "case-2", serialId: "123-46" });
    getCaseByIdOrThrowMock.mockResolvedValue(isolatedCase);
    ensureDedicatedPatientForCaseMock.mockResolvedValue("patient-1");
    getCaseByIdPopulatedOrThrowMock.mockResolvedValue(populatedCase);
    toCaseDetailsResponseDTOMock.mockReturnValue({ caseDetails: {}, masterCaseDetails: [] });
    caseRepositoryMocks.findMany.mockResolvedValue([relatedDoc]);
    mapRelatedCasesToMasterCaseDetailsMock.mockReturnValue([{ caseId: "case-2" }]);
    withMasterCaseDetailsMock.mockReturnValue({ merged: true });

    await expect(service.getCaseDetails("case-1")).resolves.toEqual({ merged: true });

    expect(caseRepositoryMocks.findMany).toHaveBeenCalledWith(
      { masterCaseId: "master-1", isDeleted: false },
      { sort: { createdAt: -1 }, populate: "patientId" },
    );
    expect(mapRelatedCasesToMasterCaseDetailsMock).toHaveBeenCalledWith([
      relatedDoc.toObject(),
    ]);
    expect(withMasterCaseDetailsMock).toHaveBeenCalledWith(
      { caseDetails: {}, masterCaseDetails: [] },
      [{ caseId: "case-2" }],
    );
  });

  it("returns base case details when no related cases are found via serial prefix fallback", async () => {
    const baseResponse = { caseDetails: { serial_id: "123-45" }, masterCaseDetails: [] };
    getCaseByIdOrThrowMock.mockResolvedValue({ _id: "case-1" });
    ensureDedicatedPatientForCaseMock.mockResolvedValue("patient-1");
    getCaseByIdPopulatedOrThrowMock.mockResolvedValue({
      masterCaseId: null,
      serialId: "123-45",
      toObject: jest.fn(() => ({ serialId: "123-45" })),
    });
    toCaseDetailsResponseDTOMock.mockReturnValue(baseResponse);
    caseRepositoryMocks.findMany.mockResolvedValue([]);

    await expect(service.getCaseDetails("case-1")).resolves.toBe(baseResponse);

    expect(caseRepositoryMocks.findMany).toHaveBeenCalledWith(
      {
        serialId: expect.any(RegExp),
        isDeleted: false,
      },
      { sort: { createdAt: -1 }, populate: "patientId" },
    );
    expect(withMasterCaseDetailsMock).not.toHaveBeenCalled();
  });

  it("releases patients, replaces medicines, and writes release audit logs", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    const existingCase = {
      _id: "case-1",
      patientId: "patient-1",
      dates: {
        stitchesRemovalDate: "old-stitches",
        nextInspectionDate: "old-inspection",
      },
    };
    getCaseBySerialIdOrThrowMock.mockResolvedValue(existingCase);
    toCanonicalJerusalemDateMock.mockReturnValue(
      new Date("2026-04-30T12:00:00.000Z"),
    );
    caseRepositoryMocks.release.mockResolvedValue(undefined);
    patientMedicineRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    mapReleaseMedicineToDataMock
      .mockReturnValueOnce({ med: 1 })
      .mockReturnValueOnce({ med: 2 });
    patientMedicineRepositoryMocks.create.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.releasePatient(
        {
          caseId: "SER-1",
          stitchesRemovalDate: null,
          nextInspectionDate: "2026-04-30",
          medicines: [{ id: "med-1" }, { id: "med-2" }],
        } as never,
        "user-1",
      ),
    ).resolves.toBeUndefined();

    expect(caseRepositoryMocks.release).toHaveBeenCalledWith(
      "case-1",
      "user-1",
      {
        dates: {
          stitchesRemovalDate: undefined,
          nextInspectionDate: new Date("2026-04-30T12:00:00.000Z"),
        },
      },
      session,
    );
    expect(patientMedicineRepositoryMocks.deleteMany).toHaveBeenCalledWith(
      { caseId: "case-1" },
      { session },
    );
    expect(patientMedicineRepositoryMocks.create).toHaveBeenNthCalledWith(
      1,
      { med: 1 },
      { session },
    );
    expect(patientMedicineRepositoryMocks.create).toHaveBeenNthCalledWith(
      2,
      { med: 2 },
      { session },
    );
  });

  it("restores archived procedure cases with a manual unarchive flag when needed", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      flags: { isProcedure: true },
      dates: { procedureDate: "2026-04-25" },
    });
    toDateInputStringMock.mockImplementation((value: any) =>
      value instanceof Date ? "2026-04-21" : "2026-04-25",
    );
    shouldPersistManualProcedureUnarchiveMock.mockReturnValue(true);
    caseRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.archivePatientCase("SER-1", false, "user-1"),
    ).resolves.toBeUndefined();

    expect(caseRepositoryMocks.updateById).toHaveBeenCalledWith(
      "case-1",
      {
        $set: {
          isArchived: false,
          isManuallyUnarchived: true,
        },
      },
      { session },
    );
  });

  it("does not mark manual unarchive when the case is not a procedure", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      flags: { isProcedure: false },
      dates: { procedureDate: "2026-04-25" },
    });
    shouldPersistManualProcedureUnarchiveMock.mockReturnValue(false);
    caseRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.archivePatientCase("SER-1", false, "user-1"),
    ).resolves.toBeUndefined();

    expect(caseRepositoryMocks.updateById).toHaveBeenCalledWith(
      "case-1",
      {
        $set: {
          isArchived: false,
          isManuallyUnarchived: false,
        },
      },
      { session },
    );
    expect(toDateInputStringMock).not.toHaveBeenCalled();
  });

  it("does not mark manual unarchive when the procedure date cannot be resolved", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      flags: { isProcedure: true },
      dates: { procedureDate: undefined },
    });
    shouldPersistManualProcedureUnarchiveMock.mockReturnValue(false);
    toDateInputStringMock.mockReturnValue(undefined);
    caseRepositoryMocks.updateById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.archivePatientCase("SER-1", false, "user-1"),
    ).resolves.toBeUndefined();

    expect(caseRepositoryMocks.updateById).toHaveBeenCalledWith(
      "case-1",
      {
        $set: {
          isArchived: false,
          isManuallyUnarchived: false,
        },
      },
      { session },
    );
  });

  it("deletes a patient case, removes linked records, and cleans up document assets", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      masterCaseId: "master-1",
    });
    documentRepositoryMocks.findByCaseId.mockResolvedValue([
      {
        _id: { toString: () => "doc-1" },
        cloudinaryPublicId: "cloud-1",
        fileName: "cloud.pdf",
        storageKey: "http://cdn.example.com/cloud.pdf",
      },
      {
        _id: { toString: () => "doc-2" },
        fileName: "local.pdf",
        storageKey: "patients/documents/local.pdf",
      },
    ]);
    documentRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    anesthesiaFormRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    patientMedicineRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    caseRepositoryMocks.deleteById.mockResolvedValue(undefined);
    masterCaseRepositoryMocks.removeCaseId.mockResolvedValue(undefined);
    masterCaseRepositoryMocks.findById.mockResolvedValue({
      _id: "master-1",
      caseIds: [],
    });
    masterCaseRepositoryMocks.deleteById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);
    deleteCaseDocumentAssetMock
      .mockRejectedValueOnce(new Error("cleanup failed"))
      .mockResolvedValueOnce(undefined);

    await expect(service.deletePatientCase("SER-1", "user-1")).resolves.toBeUndefined();

    expect(documentRepositoryMocks.deleteMany).toHaveBeenCalledWith(
      { caseId: "case-1" },
      { session },
    );
    expect(anesthesiaFormRepositoryMocks.deleteMany).toHaveBeenCalledWith(
      { caseId: "case-1" },
      { session },
    );
    expect(patientMedicineRepositoryMocks.deleteMany).toHaveBeenCalledWith(
      { caseId: "case-1" },
      { session },
    );
    expect(masterCaseRepositoryMocks.removeCaseId).toHaveBeenCalledWith(
      "master-1",
      "case-1",
      { session },
    );
    expect(masterCaseRepositoryMocks.deleteById).toHaveBeenCalledWith(
      "master-1",
      { session },
    );
    expect(deleteCaseDocumentAssetMock).toHaveBeenNthCalledWith(1, {
      _id: "doc-1",
      cloudinaryPublicId: "cloud-1",
      fileName: "cloud.pdf",
      storageKey: "http://cdn.example.com/cloud.pdf",
    });
    expect(deleteCaseDocumentAssetMock).toHaveBeenNthCalledWith(2, {
      _id: "doc-2",
      fileName: "local.pdf",
      storageKey: "patients/documents/local.pdf",
    });
    expect(warnMock).toHaveBeenCalledWith(
      "Case document asset cleanup failed after delete",
      expect.objectContaining({
        module: "patient",
        event: "patient_case_document_asset_cleanup_failed",
        case_serial_id: "SER-1",
        doc_id: "doc-1",
        file_name: "cloud.pdf",
      }),
    );
  });

  it("deletes cloudinary-backed case assets with the storage key fallback when no public id exists", async () => {
    const session = createSession();
    startSessionMock.mockResolvedValue(session);
    getCaseBySerialIdOrThrowMock.mockResolvedValue({
      _id: "case-1",
      masterCaseId: null,
    });
    documentRepositoryMocks.findByCaseId.mockResolvedValue([
      {
        _id: { toString: () => "doc-1" },
        cloudinaryPublicId: undefined,
        fileName: "cloud.pdf",
        storageKey: "http://cdn.example.com/cloud.pdf",
      },
    ]);
    documentRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    anesthesiaFormRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    patientMedicineRepositoryMocks.deleteMany.mockResolvedValue(undefined);
    caseRepositoryMocks.deleteById.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);
    deleteCaseDocumentAssetMock.mockResolvedValue(undefined);

    await expect(service.deletePatientCase("SER-1", "user-1")).resolves.toBeUndefined();

    expect(deleteCaseDocumentAssetMock).toHaveBeenCalledWith({
      _id: "doc-1",
      cloudinaryPublicId: undefined,
      fileName: "cloud.pdf",
      storageKey: "http://cdn.example.com/cloud.pdf",
    });
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

    expect(deleteFromCloudinaryMock).toHaveBeenCalledWith(
      "http://cdn.example.com/doc.pdf",
    );
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
    const queryStart = new Date("2026-03-31T00:00:00.000Z");
    const queryEnd = new Date("2026-05-02T00:00:00.000Z");
    getCalendarQueryBoundsMock.mockReturnValue({ queryStart, queryEnd });
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
        $or: [
          { "dates.procedureDate": { $gte: queryStart, $lt: queryEnd } },
          { "caseDetailsGrid.dateTime": { $gte: queryStart, $lt: queryEnd } },
        ],
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
