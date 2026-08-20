import { HttpStatus } from "@petec/shared";
import { jest } from "@jest/globals";

const warnMock = jest.fn();
const errorMock = jest.fn();
const sendErrorMock = jest.fn();

const loadErrorHandler = async (isProduction: boolean) => {
  jest.resetModules();
  warnMock.mockReset();
  errorMock.mockReset();
  sendErrorMock.mockReset();

  jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
    sendError: sendErrorMock,
  }));

  jest.unstable_mockModule("../../src/config/logger.js", () => ({
    logger: {
      warn: warnMock,
      error: errorMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      isProduction,
    },
  }));

  return import("../../src/middlewares/error.middleware.js");
};

const createRequest = () =>
  ({
    requestId: "req-1",
    method: "POST",
    originalUrl: "/api/v1/patient?tab=all",
    headers: {
      "content-type": "application/json",
    },
    ctx: {
      requestId: "req-1",
      user: {
        userId: "user-1",
        role: "ADMIN",
        permissions: [],
      },
    },
  }) as never;

describe("error middleware", () => {
  it("handles validation errors as warn-level app errors", async () => {
    const { errorHandler } = await loadErrorHandler(false);
    const { ValidationError } =
      await import("../../src/constants/error.constants.js");
    const res = {} as never;
    const details = {
      body: ["Required"],
      query: ["Invalid"],
    };

    errorHandler(
      new ValidationError("Validation failed", details),
      createRequest(),
      res,
      jest.fn(),
    );

    expect(warnMock).toHaveBeenCalledWith(
      "[POST /api/v1/patient] request failed",
      expect.objectContaining({
        module: "http",
        request_id: "req-1",
        error_name: "ValidationError",
        error_code: "VALIDATION_ERROR",
        http_status: HttpStatus.BAD_REQUEST,
        route: "POST /api/v1/patient",
        user_id: "user-1",
      }),
    );
    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.BAD_REQUEST,
      "Validation failed",
      "VALIDATION_ERROR",
      details,
      "req-1",
    );
  });

  it("handles invalid json bodies", async () => {
    const { errorHandler } = await loadErrorHandler(false);
    const res = {} as never;
    const error = Object.assign(new SyntaxError("bad json"), {
      type: "entity.parse.failed",
      status: HttpStatus.BAD_REQUEST,
    });

    errorHandler(error, createRequest(), res, jest.fn());

    expect(warnMock).toHaveBeenCalled();
    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.BAD_REQUEST,
      "Invalid JSON body",
      "INVALID_JSON_BODY",
      { body: ["Request body contains invalid JSON"] },
      "req-1",
    );
  });

  it("handles multer file-size errors", async () => {
    const { errorHandler } = await loadErrorHandler(false);
    const res = {} as never;
    const error = Object.assign(new Error("too big"), {
      name: "MulterError",
      code: "LIMIT_FILE_SIZE",
    });

    errorHandler(error, createRequest(), res, jest.fn());

    expect(warnMock).toHaveBeenCalled();
    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.PAYLOAD_TOO_LARGE,
      "File is too large",
      "FILE_TOO_LARGE",
      undefined,
      "req-1",
    );
  });

  it("maps database uniqueness races to a safe conflict response", async () => {
    const { errorHandler } = await loadErrorHandler(true);
    const res = {} as never;
    const error = Object.assign(new Error("duplicate key details"), {
      name: "MongoServerError",
      code: 11000,
    });

    errorHandler(error, createRequest(), res, jest.fn());

    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.CONFLICT,
      "Resource already exists",
      "CONFLICT",
      undefined,
      "req-1",
    );
    expect(warnMock).toHaveBeenCalled();
  });

  it("hides internal error messages in production", async () => {
    const { errorHandler } = await loadErrorHandler(true);
    const res = {} as never;

    errorHandler(new Error("boom"), createRequest(), res, jest.fn());

    expect(errorMock).toHaveBeenCalledWith(
      "[POST /api/v1/patient] request failed",
      expect.objectContaining({
        error_code: "UNKNOWN_ERROR",
        http_status: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    );
    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Internal Server Error",
      "UNKNOWN_ERROR",
      undefined,
      "req-1",
    );
  });

  it("keeps safe clinical summary guidance visible in production", async () => {
    const { errorHandler } = await loadErrorHandler(true);
    const { ClinicalSummaryUnavailableError } =
      await import("../../src/services/clinicalSummary/clinicalSummary.error.js");
    const res = {} as never;
    const error = new ClinicalSummaryUnavailableError("timeout");

    errorHandler(error, createRequest(), res, jest.fn());

    expect(sendErrorMock).toHaveBeenCalledWith(
      res,
      HttpStatus.SERVICE_UNAVAILABLE,
      expect.stringContaining("אפשר לנסות שוב בעוד רגע"),
      "CLINICAL_SUMMARY_UNAVAILABLE",
      undefined,
      "req-1",
    );
  });

  it.each([
    [
      "BadRequestError",
      "Bad request happened",
      HttpStatus.BAD_REQUEST,
      "BAD_REQUEST",
      "warn",
    ],
    [
      "AuthError",
      "Auth failed",
      HttpStatus.UNAUTHORIZED,
      "UNAUTHORIZED",
      "warn",
    ],
    ["ForbiddenError", "Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN", "warn"],
    ["NotFoundError", "Missing", HttpStatus.NOT_FOUND, "NOT_FOUND", "warn"],
    ["ConflictError", "Conflict", HttpStatus.CONFLICT, "CONFLICT", "warn"],
    [
      "InternalServerError",
      "Internal boom",
      HttpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_ERROR",
      "error",
    ],
  ] as const)(
    "maps %s to the expected API error code",
    async (errorClassName, message, statusCode, errorCode, loggerMethod) => {
      const { errorHandler } = await loadErrorHandler(false);
      const errorModule =
        await import("../../src/constants/error.constants.js");
      const ErrorClass = errorModule[errorClassName] as new (
        message?: string,
      ) => Error;
      const res = {} as never;

      errorHandler(new ErrorClass(message), createRequest(), res, jest.fn());

      expect(sendErrorMock).toHaveBeenCalledWith(
        res,
        statusCode,
        message,
        errorCode,
        undefined,
        "req-1",
      );
      expect(loggerMethod === "warn" ? warnMock : errorMock).toHaveBeenCalled();
    },
  );

  it("formats custom app-error names and sorts validation issues by message within the same path", async () => {
    const { errorHandler } = await loadErrorHandler(false);
    const { ValidationError, AppError } =
      await import("../../src/constants/error.constants.js");
    const validationRes = {} as never;

    errorHandler(
      new ValidationError("Validation failed", {
        body: ["Zulu", "Alpha"],
        query: ["Beta"],
      }),
      createRequest(),
      validationRes,
      jest.fn(),
    );

    expect(warnMock).toHaveBeenCalledWith(
      "[POST /api/v1/patient] request failed",
      expect.objectContaining({
        validation_issues: [
          { path: "body", message: "Alpha" },
          { path: "body", message: "Zulu" },
          { path: "query", message: "Beta" },
        ],
      }),
    );

    const customError = new AppError({
      message: "Teapot",
      statusCode: HttpStatus.BAD_REQUEST,
      isOperational: true,
    });
    customError.name = "TeapotError";
    const customRes = {} as never;

    errorHandler(customError, createRequest(), customRes, jest.fn());

    expect(sendErrorMock).toHaveBeenCalledWith(
      customRes,
      HttpStatus.BAD_REQUEST,
      "Teapot",
      "TEAPOT_ERROR",
      undefined,
      "req-1",
    );
  });
});
