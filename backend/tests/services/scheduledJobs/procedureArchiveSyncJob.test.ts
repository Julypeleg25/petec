import { jest } from "@jest/globals";

const infoMock = jest.fn();
const errorMock = jest.fn();
const toDateInputStringMock = jest.fn() as any;
const unarchiveProceduresScheduledForDateMock = jest.fn() as any;
const unarchiveProceduresWithCaseDetailsOnOrAfterDateMock = jest.fn() as any;
const archiveProceduresScheduledBeforeDateMock = jest.fn() as any;

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock,
  },
}));

jest.unstable_mockModule("../../../src/mappers/common/common.mappers.utils.js", () => ({
  toDateInputString: toDateInputStringMock,
}));

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  caseRepository: {
    unarchiveProceduresScheduledForDate: unarchiveProceduresScheduledForDateMock,
    unarchiveProceduresWithCaseDetailsOnOrAfterDate:
      unarchiveProceduresWithCaseDetailsOnOrAfterDateMock,
    archiveProceduresScheduledBeforeDate: archiveProceduresScheduledBeforeDateMock,
  },
}));

const { syncProcedureArchiveStatus } = await import(
  "../../../src/services/scheduledJobs/procedureArchiveSyncJob.js"
);

describe("procedureArchiveSyncJob", () => {
  beforeEach(() => {
    infoMock.mockReset();
    errorMock.mockReset();
    toDateInputStringMock.mockReset();
    unarchiveProceduresScheduledForDateMock.mockReset();
    unarchiveProceduresWithCaseDetailsOnOrAfterDateMock.mockReset();
    archiveProceduresScheduledBeforeDateMock.mockReset();
  });

  it("logs start and finish when syncing procedure archive state succeeds", async () => {
    const date = new Date("2026-04-21T08:00:00.000Z");
    toDateInputStringMock.mockReturnValue("2026-04-21");
    unarchiveProceduresScheduledForDateMock.mockResolvedValue(4);
    unarchiveProceduresWithCaseDetailsOnOrAfterDateMock.mockResolvedValue(1);
    archiveProceduresScheduledBeforeDateMock.mockResolvedValue(2);

    await expect(syncProcedureArchiveStatus(date)).resolves.toBeUndefined();

    expect(unarchiveProceduresScheduledForDateMock).toHaveBeenCalledWith(date);
    expect(unarchiveProceduresWithCaseDetailsOnOrAfterDateMock).toHaveBeenCalledWith(date);
    expect(archiveProceduresScheduledBeforeDateMock).toHaveBeenCalledWith(date);
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      "Starting procedure archive sync",
      {
        module: "scheduled-jobs",
        procedure_date: "2026-04-21",
      },
    );
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      "Finished procedure archive sync",
      {
        module: "scheduled-jobs",
        moved_cases: 4,
        moved_grid_cases: 1,
        archived_past_cases: 2,
        procedure_date: "2026-04-21",
      },
    );
  });

  it("falls back to ISO date strings when the date key cannot be formatted", async () => {
    const date = new Date("2026-04-22T10:15:00.000Z");
    toDateInputStringMock.mockReturnValue(null);
    unarchiveProceduresScheduledForDateMock.mockResolvedValue(0);
    unarchiveProceduresWithCaseDetailsOnOrAfterDateMock.mockResolvedValue(0);
    archiveProceduresScheduledBeforeDateMock.mockResolvedValue(0);

    await expect(syncProcedureArchiveStatus(date)).resolves.toBeUndefined();

    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      "Starting procedure archive sync",
      {
        module: "scheduled-jobs",
        procedure_date: date.toISOString(),
      },
    );
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      "Finished procedure archive sync",
      {
        module: "scheduled-jobs",
        moved_cases: 0,
        moved_grid_cases: 0,
        archived_past_cases: 0,
        procedure_date: date.toISOString(),
      },
    );
  });

  it("logs failures without throwing", async () => {
    const date = new Date("2026-04-23T12:30:00.000Z");
    toDateInputStringMock.mockReturnValue("2026-04-23");
    unarchiveProceduresScheduledForDateMock.mockRejectedValue(
      new Error("db unavailable"),
    );

    await expect(syncProcedureArchiveStatus(date)).resolves.toBeUndefined();

    expect(errorMock).toHaveBeenCalledWith("Failed to sync procedure archive status", {
      module: "scheduled-jobs",
      procedure_date: "2026-04-23",
      error: "db unavailable",
    });
  });
});
