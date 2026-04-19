import { EventEmitter } from "node:events";
import { HttpStatus } from "@petec/shared";
import { jest } from "@jest/globals";

const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();

jest.unstable_mockModule("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
    error: errorMock,
  },
}));

const { requestLoggerMiddleware } = await import("./requestLogger.middleware.js");

const createResponse = ({
  statusCode = HttpStatus.OK,
  contentLength,
  logSummary,
}: {
  statusCode?: number;
  contentLength?: string | number | string[] | undefined;
  logSummary?: Record<string, unknown>;
} = {}) => {
  const res = new EventEmitter() as EventEmitter & {
    statusCode: number;
    locals: Record<string, unknown>;
    getHeader: jest.Mock;
  };

  res.statusCode = statusCode;
  res.locals = logSummary ? { logSummary } : {};
  res.getHeader = jest.fn().mockReturnValue(contentLength);

  return res;
};

describe("requestLogger middleware", () => {
  afterEach(() => {
    infoMock.mockReset();
    warnMock.mockReset();
    errorMock.mockReset();
    jest.restoreAllMocks();
  });

  it("logs successful requests once with response metadata", () => {
    let now = 1000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const next = jest.fn();
    const req = {
      method: "GET",
      originalUrl: "/api/v1/patient?tab=all",
      requestId: "req-1",
      headers: {},
      ctx: {
        user: {
          userId: "user-1",
        },
      },
    } as never;
    const res: any = createResponse({
      statusCode: HttpStatus.OK,
      contentLength: ["321"],
      logSummary: {
        id: "case-1",
        length: 2,
        note: "created",
      },
    });

    requestLoggerMiddleware(req, res, next);
    now = 1123;
    res.emit("finish");
    res.emit("close");

    expect(next).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith(
      "[GET /api/v1/patient] request completed",
      {
        module: "http",
        event: "http_request_completed",
        request_id: "req-1",
        method: "GET",
        route: "/api/v1/patient",
        status_code: HttpStatus.OK,
        duration_ms: 123,
        user_id: "user-1",
        response_bytes: 321,
        id: "case-1",
        length: 2,
        note: "created",
      },
    );
  });

  it("logs warn-level responses for client errors", () => {
    let now = 2000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const req = {
      method: "PATCH",
      originalUrl: "/api/v1/patient/123",
      requestId: "req-2",
      headers: {},
    } as never;
    const res: any = createResponse({
      statusCode: HttpStatus.BAD_REQUEST,
      contentLength: 88,
    });

    requestLoggerMiddleware(req, res, jest.fn());
    now = 2050;
    res.emit("finish");

    expect(warnMock).toHaveBeenCalledWith(
      "[PATCH /api/v1/patient/123] request completed",
      expect.objectContaining({
        request_id: "req-2",
        status_code: HttpStatus.BAD_REQUEST,
        response_bytes: 88,
      }),
    );
  });

  it("logs error-level responses for server errors", () => {
    let now = 3000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const req = {
      method: "POST",
      originalUrl: "/api/v1/patient",
      requestId: "req-3",
      headers: {},
    } as never;
    const res: any = createResponse({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      contentLength: "12",
    });

    requestLoggerMiddleware(req, res, jest.fn());
    now = 3075;
    res.emit("finish");

    expect(errorMock).toHaveBeenCalledWith(
      "[POST /api/v1/patient] request completed",
      expect.objectContaining({
        request_id: "req-3",
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
        response_bytes: 12,
      }),
    );
  });

  it("skips logging for health, static, and options requests", () => {
    const next = jest.fn();
    requestLoggerMiddleware(
      {
        method: "OPTIONS",
        originalUrl: "/api/v1/patient",
        requestId: "req-4",
        headers: {},
      } as never,
      createResponse() as any,
      next,
    );
    requestLoggerMiddleware(
      {
        method: "GET",
        originalUrl: "/health",
        requestId: "req-5",
        headers: {},
      } as never,
      createResponse() as any,
      next,
    );
    requestLoggerMiddleware(
      {
        method: "GET",
        originalUrl: "/static/app.js",
        requestId: "req-6",
        headers: {},
      } as never,
      createResponse() as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(3);
    expect(infoMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });
});
