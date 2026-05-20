import { jest } from "@jest/globals";

const infoMock = jest.fn();
const errorMock = jest.fn();
const toDateInputStringMock = jest.fn() as any;
const unarchiveProceduresScheduledForDateMock = jest.fn() as any;

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
  },
}));

const { moveCasesFromArchive } = await import(
  "../../../src/services/scheduledJobs/moveCasesFromArchiveJob.js"
);

describe("moveCasesFromArchiveJob", () => {
  beforeEach(() => {
    infoMock.mockReset();
    errorMock.mockReset();
    toDateInputStringMock.mockReset();
    unarchiveProceduresScheduledForDateMock.mockReset();
  });

  it("logs start and finish when moving cases succeeds", async () => {
    const date = new Date("2026-04-21T08:00:00.000Z");
    toDateInputStringMock.mockReturnValue("2026-04-21");
    unarchiveProceduresScheduledForDateMock.mockResolvedValue(4);

    await expect(moveCasesFromArchive(date)).resolves.toBeUndefined();

    expect(unarchiveProceduresScheduledForDateMock).toHaveBeenCalledWith(date);
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      "Starting to move cases from archive",
      {
        module: "scheduled-jobs",
        procedure_date: "2026-04-21",
      },
    );
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      "Finished moving cases from archive",
      {
        module: "scheduled-jobs",
        moved_cases: 4,
        procedure_date: "2026-04-21",
      },
    );
  });

  it("falls back to ISO date strings when the date key cannot be formatted", async () => {
    const date = new Date("2026-04-22T10:15:00.000Z");
    toDateInputStringMock.mockReturnValue(null);
    unarchiveProceduresScheduledForDateMock.mockResolvedValue(0);

    await expect(moveCasesFromArchive(date)).resolves.toBeUndefined();

    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      "Starting to move cases from archive",
      {
        module: "scheduled-jobs",
        procedure_date: date.toISOString(),
      },
    );
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      "Finished moving cases from archive",
      {
        module: "scheduled-jobs",
        moved_cases: 0,
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

    await expect(moveCasesFromArchive(date)).resolves.toBeUndefined();

    expect(errorMock).toHaveBeenCalledWith("Failed to move cases from archive", {
      module: "scheduled-jobs",
      procedure_date: "2026-04-23",
      error: "db unavailable",
    });
  });
});
