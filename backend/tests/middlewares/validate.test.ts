import type { NextFunction, Request, Response } from "express";
import { jest } from "@jest/globals";
import { z } from "zod";
import { ValidationError } from "../../src/constants/error.constants.js";
import {
  toStrictSchema,
  validate,
  validateBody,
  validateParams,
  validateQuery,
} from "../../src/middlewares/validate.js";

type ValidationRequest = Partial<Request> &
  Pick<Request, "body" | "query" | "params">;

type NextHandler = (error?: Error | "route" | "router") => void;

describe("validate middleware", () => {
  it("validates and replaces body, query, and params", () => {
    const next = jest.fn<NextHandler>();
    const req: ValidationRequest = {
      body: { name: "Dana" },
      query: { page: "2" },
      params: { id: "case-1" },
    };

    validate({
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.coerce.number() }),
      params: z.object({ id: z.string() }),
    })(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({ name: "Dana" });
    expect(req.query).toEqual({ page: 2 });
    expect(req.params).toEqual({ id: "case-1" });
    expect(next).toHaveBeenCalled();
  });

  it("throws a ValidationError for strict-body violations", () => {
    const req: ValidationRequest = {
      body: { name: "Dana", extra: true },
      query: {},
      params: {},
    };

    expect(() =>
      validateBody(z.object({ name: z.string() }))(
        req as Request,
        {} as Response,
        jest.fn<NextHandler>() as NextFunction,
      ),
    ).toThrow(ValidationError);
  });

  it("throws query and params validation errors from the helper wrappers", () => {
    expect(() =>
      validateQuery(z.object({ page: z.coerce.number() }))(
        {
          body: {},
          query: { page: "bad" },
          params: {},
        } as ValidationRequest as Request,
        {} as Response,
        jest.fn<NextHandler>() as NextFunction,
      ),
    ).toThrow("Query validation failed");

    expect(() =>
      validateParams(z.object({ id: z.string().uuid() }))(
        {
          body: {},
          query: {},
          params: { id: "not-a-uuid" },
        } as ValidationRequest as Request,
        {} as Response,
        jest.fn<NextHandler>() as NextFunction,
      ),
    ).toThrow("Params validation failed");
  });

  it("returns non-object schemas unchanged when strict mode is not applicable", () => {
    const schema = z.string();

    expect(toStrictSchema(schema)).toBe(schema);
  });
});
