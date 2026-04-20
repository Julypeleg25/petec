import { HttpStatus } from "@petec/shared";
import { jest } from "@jest/globals";

const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();
const debugMock = jest.fn();

const loadLoggingModule = async (isProduction = false) => {
  jest.resetModules();
  infoMock.mockReset();
  warnMock.mockReset();
  errorMock.mockReset();
  debugMock.mockReset();

  jest.unstable_mockModule("../../../src/config/logger.js", () => ({
    logger: {
      info: infoMock,
      warn: warnMock,
      error: errorMock,
      debug: debugMock,
    },
  }));

  jest.unstable_mockModule("../../../src/config/config.js", () => ({
    ENV: {
      isProduction,
    },
  }));

  return import("../../../src/shared/logger/logging.js");
};

describe("shared/logger/logging", () => {
  it("logs informational, warning, and debug messages with request metadata", async () => {
    const { logInfo, logWarn, logDebug } = await loadLoggingModule();
    const ctx = {
      requestId: "req-1",
      user: {
        userId: "user-1",
        role: "ADMIN",
        permissions: ["patients:read"],
      },
    };

    logInfo(ctx, "patient", "loaded", { total: 2 });
    logWarn(ctx, "patient", "slow", { duration_ms: 250 });
    logDebug(ctx, "patient", "details", { cached: true });

    expect(infoMock).toHaveBeenCalledWith("loaded", {
      module: "patient",
      request_id: "req-1",
      user_id: "user-1",
      total: 2,
    });
    expect(warnMock).toHaveBeenCalledWith("slow", {
      module: "patient",
      request_id: "req-1",
      user_id: "user-1",
      duration_ms: 250,
    });
    expect(debugMock).toHaveBeenCalledWith("details", {
      module: "patient",
      request_id: "req-1",
      user_id: "user-1",
      cached: true,
    });
  });

  it("builds safe error metadata and logs structured errors in non-production mode", async () => {
    const { logError, toSafeErrorMeta } = await loadLoggingModule(false);
    const err = Object.assign(new Error("Validation failed"), {
      name: "ValidationError",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      details: {
        name: ["Required"],
        dosage: ["Too low", "Too high"],
      },
      cause: new Error("database unavailable"),
    });
    err.stack = "stack-trace";

    expect(toSafeErrorMeta(err)).toEqual({
      error_name: "ValidationError",
      error_message: "Validation failed",
      http_status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: "stack-trace",
      cause: "database unavailable",
      validation_issues: [
        { path: "name", message: "Required" },
        { path: "dosage", message: "Too low" },
        { path: "dosage", message: "Too high" },
      ],
    });

    logError(
      { requestId: "req-2" },
      "patient",
      err,
      { operation: "save-case" },
    );

    expect(errorMock).toHaveBeenCalledWith("Validation failed", {
      module: "patient",
      request_id: "req-2",
      error_name: "ValidationError",
      http_status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: "stack-trace",
      cause: "database unavailable",
      validation_issues: [
        { path: "name", message: "Required" },
        { path: "dosage", message: "Too low" },
        { path: "dosage", message: "Too high" },
      ],
      operation: "save-case",
    });
  });

  it("omits error stacks in production mode", async () => {
    const { toSafeErrorMeta } = await loadLoggingModule(true);
    const err = new Error("boom");
    err.stack = "stack-trace";

    expect(toSafeErrorMeta(err)).toEqual({
      error_name: "Error",
      error_message: "boom",
    });
  });

  it("logs request starts and successful completions with normalized routes", async () => {
    const { logRequestStart, logRequestEnd } = await loadLoggingModule();
    const ctx = { requestId: "req-3" };
    const req = {
      method: "PATCH",
      originalUrl: "/api/v1/patient/123?tab=history",
      ip: "127.0.0.1",
    } as never;
    const res = {
      statusCode: HttpStatus.OK,
      getHeader: jest.fn().mockReturnValue(["42"]),
    } as never;

    logRequestStart(ctx, req);
    logRequestEnd(ctx, req, res, 88);

    expect(infoMock).toHaveBeenNthCalledWith(1, "[PATCH /api/v1/patient/123] request started", {
      module: "http",
      request_id: "req-3",
      route: "PATCH /api/v1/patient/123",
      ip: "127.0.0.1",
    });
    expect(infoMock).toHaveBeenNthCalledWith(2, "[PATCH /api/v1/patient/123] request completed", {
      module: "http",
      request_id: "req-3",
      route: "PATCH /api/v1/patient/123",
      status_code: HttpStatus.OK,
      duration_ms: 88,
      response_bytes: 42,
    });
  });

  it("uses warn and error levels for request completions with failing statuses", async () => {
    const { logRequestEnd } = await loadLoggingModule();
    const ctx = { requestId: "req-4" };
    const req = {
      method: "GET",
      originalUrl: "/api/v1/medicine",
      ip: "127.0.0.1",
    } as never;

    logRequestEnd(
      ctx,
      req,
      {
        statusCode: HttpStatus.BAD_REQUEST,
        getHeader: jest.fn().mockReturnValue(undefined),
      } as never,
      10,
    );
    logRequestEnd(
      ctx,
      req,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        getHeader: jest.fn().mockReturnValue("9"),
      } as never,
      11,
    );

    expect(warnMock).toHaveBeenCalledWith(
      "[GET /api/v1/medicine] request completed with client error",
      {
        module: "http",
        request_id: "req-4",
        route: "GET /api/v1/medicine",
        status_code: HttpStatus.BAD_REQUEST,
        duration_ms: 10,
      },
    );
    expect(errorMock).toHaveBeenCalledWith("[GET /api/v1/medicine] request failed", {
      module: "http",
      request_id: "req-4",
      route: "GET /api/v1/medicine",
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      duration_ms: 11,
      response_bytes: 9,
    });
  });
});
