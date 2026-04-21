import { jest } from "@jest/globals";
import {
  NotFoundError,
  ValidationError,
} from "../../../src/constants/error.constants.js";

const updateCaseDetailsGridBySerialIdMock = jest.fn<
  (...args: any[]) => Promise<any | null>
>();
const findByIdMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const normalizeCaseDetailsGridMock = jest.fn<(grid: any) => any[]>();
const validateCaseDetailsGridMock = jest.fn<(rows: any[]) => any[]>();
const toGridValidationDetailsMock = jest.fn<(issues: any[]) => any>();
const infoMock = jest.fn<(...args: any[]) => void>();
const warnMock = jest.fn<(...args: any[]) => void>();

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  caseRepository: {
    updateCaseDetailsGridBySerialId: updateCaseDetailsGridBySerialIdMock,
    findById: findByIdMock,
  },
}));

jest.unstable_mockModule("../../../src/services/patient/utils/caseGridService.utils.js", () => ({
  normalizeCaseDetailsGrid: normalizeCaseDetailsGridMock,
  validateCaseDetailsGrid: validateCaseDetailsGridMock,
  toGridValidationDetails: toGridValidationDetailsMock,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
  },
}));

const { CaseGridService } = await import(
  "../../../src/services/patient/caseGridService.js"
);

describe("CaseGridService", () => {
  const service = new CaseGridService();

  beforeEach(() => {
    updateCaseDetailsGridBySerialIdMock.mockReset();
    findByIdMock.mockReset();
    normalizeCaseDetailsGridMock.mockReset();
    validateCaseDetailsGridMock.mockReset();
    toGridValidationDetailsMock.mockReset();
    infoMock.mockReset();
    warnMock.mockReset();
  });

  it("rejects invalid grids with validation details and a warning log", async () => {
    const issues = [{ row: 1, field: "temperature" }];
    normalizeCaseDetailsGridMock.mockReturnValue([{ _id: "row-1" }]);
    validateCaseDetailsGridMock.mockReturnValue(issues);
    toGridValidationDetailsMock.mockReturnValue({
      temperature: ["Out of range"],
    });

    await expect(
      service.saveGrid("case-serial-1", [[{ _id: "row-1" }]] as never),
    ).rejects.toThrow(ValidationError);

    expect(warnMock).toHaveBeenCalledWith("Grid validation failed", {
      module: "caseGrid",
      case_serial_id: "case-serial-1",
      issue_count: 1,
    });
    expect(updateCaseDetailsGridBySerialIdMock).not.toHaveBeenCalled();
  });

  it("throws when saving a valid grid for a missing case", async () => {
    normalizeCaseDetailsGridMock.mockReturnValue([{ _id: "row-1" }]);
    validateCaseDetailsGridMock.mockReturnValue([]);
    updateCaseDetailsGridBySerialIdMock.mockResolvedValue(null);

    await expect(
      service.saveGrid("case-serial-1", [[{ _id: "row-1" }]] as never, "session-1" as never),
    ).rejects.toThrow(NotFoundError);

    expect(updateCaseDetailsGridBySerialIdMock).toHaveBeenCalledWith(
      "case-serial-1",
      [{ _id: "row-1" }],
      "session-1",
    );
  });

  it("saves valid grids and logs the row count", async () => {
    normalizeCaseDetailsGridMock.mockReturnValue([{ _id: "row-1" }, { _id: "row-2" }]);
    validateCaseDetailsGridMock.mockReturnValue([]);
    updateCaseDetailsGridBySerialIdMock.mockResolvedValue({ _id: "case-1" });

    await expect(
      service.saveGrid("case-serial-1", [[{ _id: "row-1" }, { _id: "row-2" }]] as never),
    ).resolves.toBeUndefined();

    expect(infoMock).toHaveBeenCalledWith("Grid saved", {
      module: "caseGrid",
      case_serial_id: "case-serial-1",
      row_count: 2,
    });
  });

  it("returns the grid or an empty list when case details are missing", async () => {
    findByIdMock.mockResolvedValueOnce({ caseDetailsGrid: [{ _id: "row-1" }] });
    findByIdMock.mockResolvedValueOnce({ caseDetailsGrid: undefined });

    await expect(service.getGrid("case-1")).resolves.toEqual([{ _id: "row-1" }]);
    await expect(service.getGrid("case-2")).resolves.toEqual([]);
  });

  it("throws when requesting the grid for a missing case", async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(service.getGrid("missing")).rejects.toThrow(NotFoundError);
  });

  it("returns a specific grid row by id", async () => {
    const row = {
      _id: { toString: () => "row-1" },
      notes: "stable",
    };
    findByIdMock.mockResolvedValue({
      caseDetailsGrid: [row],
    });

    await expect(service.getCaseDailyDetails("case-1", "row-1")).resolves.toBe(row);
  });

  it("throws when the case or grid row cannot be found", async () => {
    findByIdMock.mockResolvedValueOnce(null);
    findByIdMock.mockResolvedValueOnce({ caseDetailsGrid: [] });

    await expect(
      service.getCaseDailyDetails("missing", "row-1"),
    ).rejects.toThrow("Case not found");
    await expect(
      service.getCaseDailyDetails("case-1", "row-1"),
    ).rejects.toThrow("Grid row not found");
  });
});
