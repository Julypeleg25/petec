import { jest } from "@jest/globals";
import type { Response } from "express";
import { HttpStatus } from "@petec/shared";
import { z } from "zod";

const errorMock = jest.fn();

jest.unstable_mockModule("../../src/config/logger.js", () => ({
  logger: {
    error: errorMock,
  },
}));

const {
  sendCreated,
  sendError,
  sendInternalServerError,
  sendNoContent,
  sendSuccess,
} = await import("../../src/utils/apiResponse.js");

const createResponse = (): Response =>
  ({
    locals: {},
    req: {
      requestId: "req-1",
      method: "GET",
      originalUrl: "/api/v1/test?x=1",
    },
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe("apiResponse", () => {
  beforeEach(() => {
    errorMock.mockReset();
  });

  it("sends validated success responses", () => {
    const res = createResponse();
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });

    sendSuccess(res, { id: "case-1", name: "Case" }, schema);

    expect(res.locals.logSummary).toEqual({ id: "case-1" });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "case-1", name: "Case" },
    });
  });

  it("sends scalar success responses without adding a log summary", () => {
    const res = createResponse();

    sendSuccess(res, "ok", z.string());

    expect(res.locals.logSummary).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: "ok",
    });
  });

  it("sends created responses with log notes", () => {
    const res = createResponse();
    const schema = z.object({
      items: z.array(z.string()),
    });

    sendCreated(res, { items: ["a", "b"] }, schema);

    expect(res.locals.logSummary).toEqual({ length: 2, note: "created" });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: ["a", "b"] },
    });
  });

  it("sends no-content responses", () => {
    const res = createResponse();

    sendNoContent(res);

    expect(res.locals.logSummary).toEqual({ note: "no-content" });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(res.send).toHaveBeenCalled();
  });

  it("sends sorted error details", () => {
    const res = createResponse();

    sendError(
      res,
      HttpStatus.BAD_REQUEST,
      "Validation failed",
      "VALIDATION_ERROR",
      {
        beta: ["second"],
        alpha: ["two", "one"],
      },
      "req-1",
    );

    expect(res.locals.logSummary).toEqual({ length: 2, note: "error" });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: [
        { field: "alpha", message: "one" },
        { field: "alpha", message: "two" },
        { field: "beta", message: "second" },
      ],
      requestId: "req-1",
    });
  });

  it("sends generic internal server errors", () => {
    const res = createResponse();

    sendInternalServerError(res, "req-9");

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId: "req-9",
    });
  });

  it("logs and throws when response validation fails", () => {
    const res = createResponse();
    const schema = z.object({
      id: z.string(),
    });

    expect(() =>
      sendSuccess(res, { id: 42 }, schema),
    ).toThrow("Response validation failed");
    expect(errorMock).toHaveBeenCalledWith(
      "Response validation failed",
      expect.objectContaining({
        request_id: "req-1",
        method: "GET",
        path: "/api/v1/test",
      }),
    );
  });
});
