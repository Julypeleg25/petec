import type { NextFunction, Request, Response } from "express";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { Types } from "mongoose";
import { jest } from "@jest/globals";
import { z } from "zod";
import { ValidationError } from "../../src/constants/error.constants.js";
import {
  toStrictSchema,
  validateAdminCreateTypeBody,
  validateAdminUpdateTypeBody,
} from "../../src/middlewares/adminTypeBodyValidation.js";

type AdminTypeRequest = Partial<Request> & Pick<Request, "params" | "body">;

type NextHandler = (error?: Error | "route" | "router") => void;

describe("adminTypeBodyValidation", () => {
  it("validates create payloads based on the type name param", () => {
    const next = jest.fn<NextHandler>();
    const req: AdminTypeRequest = {
      params: {
        typeName: [SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION],
      },
      body: {
        name: "  IV ",
      },
    };

    validateAdminCreateTypeBody(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({
      name: "IV",
    });
    expect(next).toHaveBeenCalled();
  });

  it("validates update payloads for medicine types", () => {
    const next = jest.fn<NextHandler>();
    const req: AdminTypeRequest = {
      params: {
        typeName: SYSTEM_TYPE_NAMES.MEDICINES,
      },
      body: {
        id: new Types.ObjectId().toString(),
        name: " Ketamine ",
      },
    };

    validateAdminUpdateTypeBody(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({
      id: req.body.id,
      name: "Ketamine",
    });
    expect(next).toHaveBeenCalled();
  });

  it("validates create payloads for medicine types", () => {
    const next = jest.fn<NextHandler>();
    const req: AdminTypeRequest = {
      params: {
        typeName: SYSTEM_TYPE_NAMES.MEDICINES,
      },
      body: {
        name: " Ketamine ",
      },
    };

    validateAdminCreateTypeBody(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({
      name: "Ketamine",
    });
    expect(next).toHaveBeenCalled();
  });

  it("validates update payloads for animal-vitals types", () => {
    const next = jest.fn<NextHandler>();
    const req: AdminTypeRequest = {
      params: {
        typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
      },
      body: {
        id: new Types.ObjectId().toString(),
        name: " T ",
      },
    };

    validateAdminUpdateTypeBody(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({
      id: req.body.id,
      name: "T",
    });
    expect(next).toHaveBeenCalled();
  });

  it("validates update payloads for generic system types", () => {
    const next = jest.fn<NextHandler>();
    const req: AdminTypeRequest = {
      params: {
        typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      },
      body: {
        id: new Types.ObjectId().toString(),
        name: " IV ",
      },
    };

    validateAdminUpdateTypeBody(req as Request, {} as Response, next as NextFunction);

    expect(req.body).toEqual({
      id: req.body.id,
      name: "IV",
    });
    expect(next).toHaveBeenCalled();
  });

  it("throws a validation error for invalid animal-vitals payloads", () => {
    expect(() =>
      validateAdminCreateTypeBody(
        {
          params: {
            typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
          },
          body: {
            name: "T",
          },
        } as AdminTypeRequest as Request,
        {} as Response,
        jest.fn<NextHandler>() as NextFunction,
      ),
    ).toThrow(ValidationError);
  });

  it("throws a validation error for invalid generic update payloads", () => {
    expect(() =>
      validateAdminUpdateTypeBody(
        {
          params: {
            typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
          },
          body: {},
        } as AdminTypeRequest as Request,
        {} as Response,
        jest.fn<NextHandler>() as NextFunction,
      ),
    ).toThrow(ValidationError);
  });

  it("returns non-object schemas unchanged when strict mode is not applicable", () => {
    const schema = z.string();

    expect(toStrictSchema(schema)).toBe(schema);
  });
});
