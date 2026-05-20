import { jest } from "@jest/globals";

const randomUUIDMock = jest.fn<() => string>();

jest.unstable_mockModule("crypto", () => ({
  randomUUID: randomUUIDMock,
}));

const { requestIdMiddleware } = await import("../../src/middlewares/requestId.js");

describe("requestId middleware", () => {
  afterEach(() => {
    randomUUIDMock.mockReset();
  });

  it("reuses a valid incoming request id", () => {
    const setHeader = jest.fn();
    const next = jest.fn();
    const req: any = {
      headers: {
        "x-request-id": "request-123",
      },
    };
    const res: any = {
      setHeader,
    };

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe("request-123");
    expect(req.ctx).toEqual({ requestId: "request-123" });
    expect(setHeader).toHaveBeenCalledWith("x-request-id", "request-123");
    expect(next).toHaveBeenCalled();
    expect(randomUUIDMock).not.toHaveBeenCalled();
  });

  it("generates a request id when the incoming one is invalid", () => {
    randomUUIDMock.mockReturnValue("generated-request-id");
    const setHeader = jest.fn();
    const next = jest.fn();
    const req: any = {
      headers: {
        "x-request-id": "a".repeat(129),
      },
    };
    const res: any = {
      setHeader,
    };

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe("generated-request-id");
    expect(req.ctx).toEqual({ requestId: "generated-request-id" });
    expect(setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "generated-request-id",
    );
    expect(randomUUIDMock).toHaveBeenCalled();
  });
});