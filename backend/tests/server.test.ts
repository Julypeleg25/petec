import { APP_EXIT_CODE_ERROR } from "@petec/shared";
import { jest } from "@jest/globals";

const connectToDatabaseMock = jest.fn<() => Promise<void>>();
const initializeScheduledJobsMock = jest.fn<(isProduction: boolean) => () => void>();
const stopScheduledJobsMock = jest.fn<() => void>();
const listenMock = jest.fn<(...args: any[]) => any>();
const serverCloseMock = jest.fn<(...args: any[]) => void>();
const closeConnectionMock = jest.fn<() => Promise<void>>();
const infoMock = jest.fn<(...args: any[]) => void>();
const errorMock = jest.fn<(...args: any[]) => void>();

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const loadServerModule = async () => {
  initializeScheduledJobsMock.mockReturnValue(stopScheduledJobsMock);
  listenMock.mockImplementation((port: number, callback: () => void) => {
    callback();
    return {
      close: serverCloseMock,
    };
  });

  jest.unstable_mockModule("../src/app.js", () => ({
    default: {
      listen: listenMock,
    },
  }));

  jest.unstable_mockModule("../src/config/config.js", () => ({
    ENV: {
      port: 5050,
      nodeEnv: "test",
      isProduction: false,
    },
  }));

  jest.unstable_mockModule("../src/config/logger.js", () => ({
    logger: {
      info: infoMock,
      error: errorMock,
    },
  }));

  jest.unstable_mockModule("../src/db/dbConnection.js", () => ({
    default: connectToDatabaseMock,
  }));

  jest.unstable_mockModule("../src/utils/serverSchedule.utils.js", () => ({
    initializeScheduledJobs: initializeScheduledJobsMock,
  }));

  jest.unstable_mockModule("mongoose", () => ({
    default: {
      connection: {
        close: closeConnectionMock,
      },
    },
  }));

  await import("../src/server.js");
  await flushAsyncWork();
};

describe("server.ts", () => {
  let processOnSpy: jest.SpiedFunction<typeof process.on>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;
  let setTimeoutSpy: jest.SpiedFunction<typeof setTimeout>;

  beforeEach(() => {
    jest.resetModules();
    connectToDatabaseMock.mockReset();
    initializeScheduledJobsMock.mockReset();
    stopScheduledJobsMock.mockReset();
    listenMock.mockReset();
    serverCloseMock.mockReset();
    closeConnectionMock.mockReset();
    infoMock.mockReset();
    errorMock.mockReset();

    processOnSpy = jest.spyOn(process, "on");
    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);
    setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation(((() => 0 as unknown as ReturnType<typeof setTimeout>) as unknown) as typeof setTimeout);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("starts the server, initializes jobs, and shuts down gracefully on signals", async () => {
    const signalHandlers = new Map<string, () => void>();
    connectToDatabaseMock.mockResolvedValue(undefined);
    closeConnectionMock.mockResolvedValue(undefined);
    serverCloseMock.mockImplementation(async (callback: () => Promise<void>) => {
      await callback();
    });
    processOnSpy.mockImplementation(((event: any, handler: any) => {
      signalHandlers.set(String(event), handler);
      return process;
    }) as typeof process.on);

    await loadServerModule();

    expect(connectToDatabaseMock).toHaveBeenCalled();
    expect(listenMock).toHaveBeenCalledWith(5050, expect.any(Function));
    expect(infoMock).toHaveBeenCalledWith("Server running on port 5050 in test mode");
    expect(initializeScheduledJobsMock).toHaveBeenCalledWith(false);
    expect(signalHandlers.has("SIGTERM")).toBe(true);
    expect(signalHandlers.has("SIGINT")).toBe(true);

    signalHandlers.get("SIGTERM")?.();
    await flushAsyncWork();

    expect(infoMock).toHaveBeenCalledWith("SIGTERM received, shutting down gracefully");
    expect(stopScheduledJobsMock).toHaveBeenCalled();
    expect(serverCloseMock).toHaveBeenCalledWith(expect.any(Function));
    expect(closeConnectionMock).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalledWith("MongoDB connection closed");
    expect(processExitSpy).toHaveBeenCalledWith(0);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
  });

  it("logs startup failures and exits with an error code", async () => {
    connectToDatabaseMock.mockRejectedValue(new Error("db unavailable"));
    processOnSpy.mockImplementation((() => process) as typeof process.on);

    await loadServerModule();

    expect(errorMock).toHaveBeenCalledWith("Failed to start server", {
      error: "db unavailable",
    });
    expect(processExitSpy).toHaveBeenCalledWith(APP_EXIT_CODE_ERROR);
  });
});
