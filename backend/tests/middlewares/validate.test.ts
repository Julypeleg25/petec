import { jest } from "@jest/globals";
import { z } from "zod";
import { ValidationError } from "../../src/constants/error.constants.js";
import {
  validate,
  validateBody,
  validateParams,
  validateQuery,
} from "../../src/middlewares/validate.js";

describe("validate middleware", () => {
  it("validates and replaces body, query, and params", () => {
    const next = jest.fn();
    const req: any = {
      body: { name: "Dana" },
      query: { page: "2" },
      params: { id: "case-1" },
    };

    validate({
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.coerce.number() }),
      params: z.object({ id: z.string() }),
    })(req, {} as never, next);

    expect(req.body).toEqual({ name: "Dana" });
    expect(req.query).toEqual({ page: 2 });
    expect(req.params).toEqual({ id: "case-1" });
    expect(next).toHaveBeenCalled();
  });

  it("throws a ValidationError for strict-body violations", () => {
    const req = {
      body: { name: "Dana", extra: true },
      query: {},
      params: {},
    } as never;

    expect(() =>
      validateBody(z.object({ name: z.string() }))(req, {} as never, jest.fn()),
    ).toThrow(ValidationError);
  });

  it("throws query and params validation errors from the helper wrappers", () => {
    expect(() =>
      validateQuery(z.object({ page: z.coerce.number() }))(
        {
          body: {},
          query: { page: "bad" },
          params: {},
        } as never,
        {} as never,
        jest.fn(),
      ),
    ).toThrow("Query validation failed");

    expect(() =>
      validateParams(z.object({ id: z.string().uuid() }))(
        {
          body: {},
          query: {},
          params: { id: "not-a-uuid" },
        } as never,
        {} as never,
        jest.fn(),
      ),
    ).toThrow("Params validation failed");
  });
});