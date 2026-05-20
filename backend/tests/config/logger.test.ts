import { jest } from "@jest/globals";

const formatFactoryMock = jest.fn() as any;
const timestampMock = jest.fn() as any;
const errorsMock = jest.fn() as any;
const jsonMock = jest.fn() as any;
const printfMock = jest.fn() as any;
const combineMock = jest.fn() as any;
const consoleTransportMock = jest.fn() as any;
const fileTransportMock = jest.fn() as any;
const createLoggerMock = jest.fn() as any;
const resolveMock = jest.fn() as any;
const maskSensitiveDataMock = jest.fn() as any;

const ORIGINAL_ENV = {
  RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
  RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
  RAILWAY_DEPLOYMENT_ID: process.env.RAILWAY_DEPLOYMENT_ID,
  RAILWAY_REPLICA_ID: process.env.RAILWAY_REPLICA_ID,
  LOG_FILE_PATH: process.env.LOG_FILE_PATH,
};

const restoreProcessEnv = () => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const setProcessEnvValue = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const loadLoggerModule = async ({
  isProduction = false,
  nodeEnv = "development",
  railwayServiceName,
  railwayEnvironmentName,
  railwayDeploymentId,
  railwayReplicaId,
  logFilePath,
}: {
  isProduction?: boolean;
  nodeEnv?: string;
  railwayServiceName?: string;
  railwayEnvironmentName?: string;
  railwayDeploymentId?: string;
  railwayReplicaId?: string;
  logFilePath?: string;
} = {}) => {
  jest.resetModules();
  formatFactoryMock.mockReset();
  timestampMock.mockReset();
  errorsMock.mockReset();
  jsonMock.mockReset();
  printfMock.mockReset();
  combineMock.mockReset();
  consoleTransportMock.mockReset();
  fileTransportMock.mockReset();
  createLoggerMock.mockReset();
  resolveMock.mockReset();
  maskSensitiveDataMock.mockReset();

  setProcessEnvValue("RAILWAY_SERVICE_NAME", railwayServiceName);
  setProcessEnvValue("RAILWAY_ENVIRONMENT_NAME", railwayEnvironmentName);
  setProcessEnvValue("RAILWAY_DEPLOYMENT_ID", railwayDeploymentId);
  setProcessEnvValue("RAILWAY_REPLICA_ID", railwayReplicaId);
  setProcessEnvValue("LOG_FILE_PATH", logFilePath);

  formatFactoryMock.mockImplementation((transformer: unknown) => {
    const formatFactory = () => ({
      kind: "custom-format-instance",
      transformer,
    });
    return Object.assign(formatFactory, { transformer });
  });
  timestampMock.mockImplementation((options: unknown) => ({
    kind: "timestamp-format",
    options,
  }));
  errorsMock.mockImplementation((options: unknown) => ({
    kind: "errors-format",
    options,
  }));
  jsonMock.mockReturnValue({ kind: "json-format" });
  printfMock.mockImplementation((formatter: unknown) => ({
    kind: "printf-format",
    formatter,
  }));
  combineMock.mockImplementation((...parts: unknown[]) => ({
    kind: "combine-format",
    parts,
  }));
  consoleTransportMock.mockImplementation(function mockConsoleTransport(
    this: Record<string, unknown>,
    options: unknown,
  ) {
    this.kind = "console-transport";
    this.options = options;
  });
  fileTransportMock.mockImplementation(function mockFileTransport(
    this: Record<string, unknown>,
    options: unknown,
  ) {
    this.kind = "file-transport";
    this.options = options;
  });
  createLoggerMock.mockImplementation((options: unknown) => ({
    options,
  }));
  resolveMock.mockImplementation((...parts: string[]) => parts.join("::"));
  maskSensitiveDataMock.mockImplementation(() => ({
    token: "***",
    nested: { password: "***" },
  }));

  const formatObject = Object.assign(formatFactoryMock, {
    timestamp: timestampMock,
    errors: errorsMock,
    json: jsonMock,
    printf: printfMock,
    combine: combineMock,
  });

  jest.unstable_mockModule("winston", () => ({
    default: {
      format: formatObject,
      transports: {
        Console: consoleTransportMock,
        File: fileTransportMock,
      },
      createLogger: createLoggerMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      isProduction,
      nodeEnv,
    },
  }));

  jest.unstable_mockModule("path", () => ({
    default: {
      resolve: resolveMock,
    },
  }));

  jest.unstable_mockModule("../../src/utils/sanitizer.js", () => ({
    maskSensitiveData: maskSensitiveDataMock,
  }));

  return import("../../src/config/logger.js");
};

describe("config/logger", () => {
  afterEach(() => {
    restoreProcessEnv();
  });

  it("builds a development logger with sanitizing and printable formatting", async () => {
    const { logger } = await loadLoggerModule({
      isProduction: false,
      nodeEnv: "development",
      railwayServiceName: "petec-backend",
      railwayEnvironmentName: "staging",
      railwayDeploymentId: "deploy-1",
      railwayReplicaId: "replica-1",
      logFilePath: "logs/backend.log",
    });

    expect(timestampMock).toHaveBeenCalledWith({
      format: "YYYY-MM-DD HH:mm:ss",
    });
    expect(errorsMock).toHaveBeenCalledWith({ stack: true });
    expect(jsonMock).not.toHaveBeenCalled();
    expect(printfMock).toHaveBeenCalledTimes(1);
    expect(consoleTransportMock).toHaveBeenCalledWith({
      stderrLevels: ["error"],
    });
    expect(resolveMock).toHaveBeenCalledWith(process.cwd(), "logs/backend.log");
    expect(fileTransportMock).toHaveBeenCalledWith({
      filename: `${process.cwd()}::logs/backend.log`,
      level: "debug",
    });

    expect(createLoggerMock).toHaveBeenCalledWith({
      level: "debug",
      defaultMeta: {
        service_name: "petec-backend",
        environment_name: "staging",
        deployment_id: "deploy-1",
        replica_id: "replica-1",
      },
      format: expect.objectContaining({ kind: "combine-format" }),
      transports: [
        expect.objectContaining({
          kind: "console-transport",
          options: { stderrLevels: ["error"] },
        }),
        expect.objectContaining({
          kind: "file-transport",
          options: {
            filename: `${process.cwd()}::logs/backend.log`,
            level: "debug",
          },
        }),
      ],
      exitOnError: false,
    });
    expect(logger).toEqual({
      options: expect.any(Object),
    });

    const sanitizeLogInfoFactory = formatFactoryMock.mock.results[0].value;
    const sanitized = sanitizeLogInfoFactory.transformer({
      level: "info",
      message: "Started",
      timestamp: "2026-04-20 12:00:00",
      stack: "stack trace",
      token: "secret",
      nested: { password: "top-secret" },
    });
    expect(maskSensitiveDataMock).toHaveBeenCalledWith({
      token: "secret",
      nested: { password: "top-secret" },
    });
    expect(sanitized).toEqual({
      level: "info",
      message: "Started",
      timestamp: "2026-04-20 12:00:00",
      stack: "stack trace",
      token: "***",
      nested: { password: "***" },
    });

    const renderLogLine = printfMock.mock.calls[0][0];
    const circularMeta: any = {};
    circularMeta.self = circularMeta;
    const rendered = renderLogLine({
      timestamp: "2026-04-20 12:00:00",
      level: "info",
      message: "Started",
      stack: "stack trace",
      plain: "value",
      count: 2,
      flag: false,
      none: null,
      skip: undefined,
      complex: circularMeta,
    });

    expect(rendered).toContain("[2026-04-20 12:00:00] INFO: Started");
    expect(rendered).toContain("plain=value");
    expect(rendered).toContain("count=2");
    expect(rendered).toContain("flag=false");
    expect(rendered).toContain("none=null");
    expect(rendered).toContain("complex=[unserializable]");
    expect(rendered).not.toContain("skip=");
    expect(rendered).toContain("\nstack trace");
  });

  it("builds a production logger with JSON output and no file transport for blank paths", async () => {
    await loadLoggerModule({
      isProduction: true,
      nodeEnv: "production",
      logFilePath: "   ",
    });

    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(printfMock).not.toHaveBeenCalled();
    expect(fileTransportMock).not.toHaveBeenCalled();
    expect(createLoggerMock).toHaveBeenCalledWith({
      level: "info",
      defaultMeta: {
        service_name: "backend",
        environment_name: "production",
        deployment_id: undefined,
        replica_id: undefined,
      },
      format: expect.objectContaining({ kind: "combine-format" }),
      transports: [
        expect.objectContaining({
          kind: "console-transport",
          options: { stderrLevels: ["error"] },
        }),
      ],
      exitOnError: false,
    });
  });
});
