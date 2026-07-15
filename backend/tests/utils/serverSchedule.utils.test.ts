import { jest } from "@jest/globals";

const infoMock = jest.fn();
const errorMock = jest.fn();
const scheduleMock = jest.fn();
const stopMock = jest.fn();
const syncProcedureArchiveStatusMock = jest.fn<(date: Date) => Promise<void>>();
const syncClientsMock = jest.fn<() => Promise<{ synced: number }>>();

jest.unstable_mockModule("node-cron", () => ({
  default: {
    schedule: scheduleMock,
  },
  schedule: scheduleMock,
}));

jest.unstable_mockModule("../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock,
  },
}));

jest.unstable_mockModule("../../src/services/scheduledJobs/procedureArchiveSyncJob.js", () => ({
  syncProcedureArchiveStatus: syncProcedureArchiveStatusMock,
}));

jest.unstable_mockModule("../../src/services/clinica/clinicaClient.service.js", () => ({
  clinicaClientService: {
    syncClients: syncClientsMock,
  },
}));

const { initializeScheduledJobs } = await import("../../src/utils/serverSchedule.utils.js");

describe("serverSchedule.utils", () => {
  beforeEach(() => {
    infoMock.mockReset();
    errorMock.mockReset();
    scheduleMock.mockReset();
    stopMock.mockReset();
    syncProcedureArchiveStatusMock.mockReset();
    syncClientsMock.mockReset();
    scheduleMock.mockReturnValue({ stop: stopMock });
    syncProcedureArchiveStatusMock.mockResolvedValue(undefined);
    syncClientsMock.mockResolvedValue({ synced: 1 });
  });

  it("does not schedule jobs outside production", () => {
    const cleanup = initializeScheduledJobs(false);

    expect(infoMock).toHaveBeenCalledWith(
      "Scheduled jobs skipped in non-production mode",
      { module: "scheduler" },
    );
    expect(scheduleMock).not.toHaveBeenCalled();
    expect(syncProcedureArchiveStatusMock).not.toHaveBeenCalled();

    cleanup();
  });

  it("runs procedure archive sync at startup and schedules daily production jobs", () => {
    const now = new Date("2026-04-19T08:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);

    const cleanup = initializeScheduledJobs(true);

    expect(infoMock).toHaveBeenCalledWith("Scheduled jobs initialized", {
      module: "scheduler",
    });
    expect(syncProcedureArchiveStatusMock).toHaveBeenCalledTimes(1);
    expect(syncProcedureArchiveStatusMock).toHaveBeenCalledWith(now);
    expect(scheduleMock).toHaveBeenNthCalledWith(
      1,
      "0 8 * * *",
      expect.any(Function),
      { timezone: "Asia/Jerusalem" },
    );
    expect(scheduleMock).toHaveBeenNthCalledWith(
      2,
      "0 6 * * *",
      expect.any(Function),
      { timezone: "Asia/Jerusalem" },
    );

    const archiveCallback = scheduleMock.mock.calls[0][1] as () => void;
    const nextRun = new Date("2026-04-20T08:00:00.000Z");
    jest.setSystemTime(nextRun);
    archiveCallback();

    expect(syncProcedureArchiveStatusMock).toHaveBeenCalledTimes(2);
    expect(syncProcedureArchiveStatusMock).toHaveBeenNthCalledWith(2, nextRun);

    cleanup();

    expect(stopMock).toHaveBeenCalledTimes(2);
    expect(infoMock).toHaveBeenCalledWith("Scheduled jobs stopped", {
      module: "scheduler",
    });

    jest.useRealTimers();
  });
});
