import { jest } from "@jest/globals";
import { NotFoundError } from "../../../../src/constants/error.constants.js";

const findByIdMock = jest.fn() as any;
const findByIdPopulatedMock = jest.fn() as any;
const findBySerialIdMock = jest.fn() as any;
const findByPatientIdMock = jest.fn() as any;
const updateByIdMock = jest.fn() as any;
const findBySerialPrefixMock = jest.fn() as any;
const assignMasterCaseBySerialPrefixMock = jest.fn() as any;
const addCaseIdMock = jest.fn() as any;
const createMasterCaseMock = jest.fn() as any;
const findPatientByIdMock = jest.fn() as any;
const createPatientMock = jest.fn() as any;
const infoMock = jest.fn();

jest.unstable_mockModule("../../../../src/repositories/patient/index.js", () => ({
  caseRepository: {
    findById: findByIdMock,
    findByIdPopulated: findByIdPopulatedMock,
    findBySerialId: findBySerialIdMock,
    findByPatientId: findByPatientIdMock,
    updateById: updateByIdMock,
    findBySerialPrefix: findBySerialPrefixMock,
    assignMasterCaseBySerialPrefix: assignMasterCaseBySerialPrefixMock,
  },
  masterCaseRepository: {
    addCaseId: addCaseIdMock,
    create: createMasterCaseMock,
  },
  patientRepository: {
    findById: findPatientByIdMock,
    create: createPatientMock,
  },
}));

jest.unstable_mockModule("../../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

const patientServiceUtils = await import("../../../../src/services/patient/utils/patientService.utils.js");

describe("patientService.utils", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdPopulatedMock.mockReset();
    findBySerialIdMock.mockReset();
    findByPatientIdMock.mockReset();
    updateByIdMock.mockReset();
    findBySerialPrefixMock.mockReset();
    assignMasterCaseBySerialPrefixMock.mockReset();
    addCaseIdMock.mockReset();
    createMasterCaseMock.mockReset();
    findPatientByIdMock.mockReset();
    createPatientMock.mockReset();
    infoMock.mockReset();
  });

  it("gets cases or throws when missing", async () => {
    findByIdMock.mockResolvedValue({ _id: "case-1" });
    findByIdPopulatedMock.mockResolvedValue({ _id: "case-2" });
    findBySerialIdMock.mockResolvedValue({ _id: "case-3" });

    await expect(patientServiceUtils.getCaseByIdOrThrow("case-1")).resolves.toEqual({
      _id: "case-1",
    });
    expect(findByIdMock).toHaveBeenCalledWith("case-1", { session: undefined });

    await expect(
      patientServiceUtils.getCaseByIdPopulatedOrThrow("case-2"),
    ).resolves.toEqual({ _id: "case-2" });

    await expect(
      patientServiceUtils.getCaseBySerialIdOrThrow("case-3"),
    ).resolves.toEqual({ _id: "case-3" });

    findByIdMock.mockResolvedValueOnce(null);
    await expect(
      patientServiceUtils.getCaseByIdOrThrow("missing"),
    ).rejects.toThrow(NotFoundError);
  });

  it("keeps the same patient when the case is already dedicated", async () => {
    findByPatientIdMock.mockResolvedValue([{ _id: "case-1" }]);

    await expect(
      patientServiceUtils.ensureDedicatedPatientForCase({
        _id: "case-1",
        patientId: "patient-1",
        serialId: "100-1",
      } as never),
    ).resolves.toBe("patient-1");

    expect(findPatientByIdMock).not.toHaveBeenCalled();
  });

  it("isolates the patient when multiple cases share the same patient", async () => {
    const caseDoc: any = {
      _id: "case-1",
      patientId: "patient-1",
      serialId: "100-1",
    };

    findByPatientIdMock.mockResolvedValue([{ _id: "case-1" }, { _id: "case-2" }]);
    findPatientByIdMock.mockResolvedValue({
      _id: "patient-1",
      name: "Milo",
      owner: { name: "Owner", phone: "0501234567" },
      photoName: "photo.jpg",
      refs: { note: "x" },
    });
    createPatientMock.mockResolvedValue({
      _id: "patient-2",
    });
    updateByIdMock.mockResolvedValue(undefined);

    await expect(
      patientServiceUtils.ensureDedicatedPatientForCase(caseDoc),
    ).resolves.toBe("patient-2");

    expect(createPatientMock).toHaveBeenCalledWith(
      {
        serialId: "100-1",
        name: "Milo",
        owner: { name: "Owner", phone: "0501234567" },
        photoName: "photo.jpg",
        refs: { note: "x" },
      },
      { session: undefined },
    );
    expect(updateByIdMock).toHaveBeenCalledWith(
      "case-1",
      { $set: { patientId: "patient-2" } },
      { session: undefined },
    );
    expect(caseDoc.patientId).toBe("patient-2");
    expect(infoMock).toHaveBeenCalledWith("Case patient isolated", {
      module: "patient",
      case_id: "case-1",
      previous_patient_id: "patient-1",
      patient_id: "patient-2",
    });
  });

  it("throws when the source patient cannot be found during isolation", async () => {
    findByPatientIdMock.mockResolvedValue([{ _id: "case-1" }, { _id: "case-2" }]);
    findPatientByIdMock.mockResolvedValue(null);

    await expect(
      patientServiceUtils.ensureDedicatedPatientForCase({
        _id: "case-1",
        patientId: "patient-1",
        serialId: "100-1",
      } as never),
    ).rejects.toThrow("Patient not found");
  });

  it("returns null when no serial prefix or matching cases exist", async () => {
    await expect(
      patientServiceUtils.resolveMasterCaseBySerialPrefix("   "),
    ).resolves.toBeNull();

    findBySerialPrefixMock.mockResolvedValue([]);
    await expect(
      patientServiceUtils.resolveMasterCaseBySerialPrefix("100-1"),
    ).resolves.toBeNull();
  });

  it("reuses an existing master case id when one already exists", async () => {
    findBySerialPrefixMock.mockResolvedValue([
      { _id: "case-1", masterCaseId: "master-1" },
      { _id: "case-2", masterCaseId: null },
    ]);
    assignMasterCaseBySerialPrefixMock.mockResolvedValue(undefined);
    addCaseIdMock.mockResolvedValue(undefined);

    await expect(
      patientServiceUtils.resolveMasterCaseBySerialPrefix("100-1"),
    ).resolves.toBe("master-1");

    expect(assignMasterCaseBySerialPrefixMock).toHaveBeenCalledWith(
      "100",
      "master-1",
      { session: undefined },
    );
    expect(addCaseIdMock).toHaveBeenCalledTimes(2);
    expect(addCaseIdMock).toHaveBeenNthCalledWith(
      1,
      "master-1",
      "case-1",
      { session: undefined },
    );
  });

  it("creates a new master case when needed", async () => {
    findBySerialPrefixMock.mockResolvedValue([
      { _id: "case-1", masterCaseId: null },
      { _id: "case-2", masterCaseId: null },
    ]);
    createMasterCaseMock.mockResolvedValue({
      _id: "master-new",
    });
    assignMasterCaseBySerialPrefixMock.mockResolvedValue(undefined);

    await expect(
      patientServiceUtils.resolveMasterCaseBySerialPrefix("200-3"),
    ).resolves.toBe("master-new");

    expect(createMasterCaseMock).toHaveBeenCalledWith(
      { caseIds: ["case-1", "case-2"] },
      { session: undefined },
    );
    expect(assignMasterCaseBySerialPrefixMock).toHaveBeenCalledWith(
      "200",
      "master-new",
      { session: undefined },
    );
  });
});