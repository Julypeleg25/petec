import { jest } from "@jest/globals";

const infoMock = jest.fn();
const moveCasesFromArchiveMock = jest.fn<(date: Date) => Promise<void>>();

jest.unstable_mockModule("../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

jest.unstable_mockModule("../../src/services/scheduledJobs/moveCasesFromArchiveJob.js", () => ({
  moveCasesFromArchive: moveCasesFromArchiveMock,
}));

const { initializeScheduledJobs } = await import("../../src/utils/serverSchedule.utils.js");

describe("serverSchedule.utils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    infoMock.mockReset();
    moveCasesFromArchiveMock.mockReset();
    moveCasesFromArchiveMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not schedule jobs outside production", () => {
    const cleanup = initializeScheduledJobs(false);

    expect(infoMock).not.toHaveBeenCalled();
    expect(moveCasesFromArchiveMock).not.toHaveBeenCalled();

    cleanup();
  });

  it("runs the archive move once at 08:00 and again the next day", () => {
    jest.setSystemTime(new Date(2026, 3, 19, 8, 0, 0));

    const cleanup = initializeScheduledJobs(true);

    expect(infoMock).toHaveBeenCalledWith("Initializing scheduled jobs");
    expect(moveCasesFromArchiveMock).toHaveBeenCalledTimes(1);
    expect(moveCasesFromArchiveMock).toHaveBeenNthCalledWith(
      1,
      new Date(2026, 3, 19, 8, 0, 0),
    );

    jest.advanceTimersByTime(60_000);
    expect(moveCasesFromArchiveMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date(2026, 3, 20, 7, 59, 0));
    jest.advanceTimersByTime(60_000);

    expect(moveCasesFromArchiveMock).toHaveBeenCalledTimes(2);
    expect(moveCasesFromArchiveMock).toHaveBeenNthCalledWith(
      2,
      new Date(2026, 3, 20, 8, 0, 0),
    );

    cleanup();
    jest.advanceTimersByTime(60_000);

    expect(moveCasesFromArchiveMock).toHaveBeenCalledTimes(2);
  });
});