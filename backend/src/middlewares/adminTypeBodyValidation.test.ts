import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { Types } from "mongoose";
import { jest } from "@jest/globals";
import { ValidationError } from "../constants/error.constants.js";
import {
  validateAdminCreateTypeBody,
  validateAdminUpdateTypeBody,
} from "./adminTypeBodyValidation.js";

describe("adminTypeBodyValidation", () => {
  it("validates create payloads based on the type name param", () => {
    const next = jest.fn();
    const req: any = {
      params: {
        typeName: [SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION],
      },
      body: {
        name: "  IV ",
      },
    };

    validateAdminCreateTypeBody(req, {} as never, next);

    expect(req.body).toEqual({
      name: "IV",
    });
    expect(next).toHaveBeenCalled();
  });

  it("validates update payloads for medicine types", () => {
    const next = jest.fn();
    const req: any = {
      params: {
        typeName: SYSTEM_TYPE_NAMES.MEDICINES,
      },
      body: {
        id: new Types.ObjectId().toString(),
        name: " Ketamine ",
      },
    };

    validateAdminUpdateTypeBody(req, {} as never, next);

    expect(req.body).toEqual({
      id: req.body.id,
      name: "Ketamine",
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
        } as never,
        {} as never,
        jest.fn(),
      ),
    ).toThrow(ValidationError);
  });
});
