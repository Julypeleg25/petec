import { jest } from "@jest/globals";
import { NotFoundError } from "../../src/constants/error.constants.js";
import { notFound } from "../../src/middlewares/notFound.middleware.js";

describe("notFound middleware", () => {
  it("forwards a NotFoundError with the missing route", () => {
    const next = jest.fn();

    notFound(
      {
        method: "GET",
        originalUrl: "/api/v1/missing",
      } as never,
      {} as never,
      next,
    );

    const error = next.mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("Route GET /api/v1/missing not found");
  });
});