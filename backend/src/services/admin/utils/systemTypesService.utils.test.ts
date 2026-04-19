import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { jest } from "@jest/globals";
import { BadRequestError } from "../../../constants/error.constants.js";

const findByNameIncludingDeletedMock = jest.fn<
  (typeName: string, name: string) => Promise<{ name?: string; isDeleted?: boolean } | undefined>
>();
const findByNameIncludingDeletedExceptIdMock = jest.fn<
  (
    typeName: string,
    name: string,
    excludeId: string,
  ) => Promise<{ name?: string; isDeleted?: boolean } | undefined>
>();

jest.unstable_mockModule("../../../repositories/admin/index.js", () => ({
  systemTypesRepository: {
    findByNameIncludingDeleted: findByNameIncludingDeletedMock,
    findByNameIncludingDeletedExceptId: findByNameIncludingDeletedExceptIdMock,
  },
}));

const {
  ensureSystemTypeNameIsUnique,
  toCreateSystemTypePayload,
  toUpdateSystemTypePayload,
} = await import("./systemTypesService.utils.js");

describe("systemTypesService.utils", () => {
  beforeEach(() => {
    findByNameIncludingDeletedMock.mockReset();
    findByNameIncludingDeletedExceptIdMock.mockReset();
  });

  it("skips uniqueness checks for blank names", async () => {
    await expect(
      ensureSystemTypeNameIsUnique(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "   "),
    ).resolves.toBeUndefined();
    expect(findByNameIncludingDeletedMock).not.toHaveBeenCalled();
  });

  it("checks uniqueness with and without excluded ids", async () => {
    findByNameIncludingDeletedMock.mockResolvedValue(undefined);
    findByNameIncludingDeletedExceptIdMock.mockResolvedValue(undefined);

    await expect(
      ensureSystemTypeNameIsUnique(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, " IV "),
    ).resolves.toBeUndefined();
    expect(findByNameIncludingDeletedMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "IV",
    );

    await expect(
      ensureSystemTypeNameIsUnique(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        " IV ",
        "exclude-1",
      ),
    ).resolves.toBeUndefined();
    expect(findByNameIncludingDeletedExceptIdMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "IV",
      "exclude-1",
    );
  });

  it("throws descriptive errors for duplicate active and deleted names", async () => {
    findByNameIncludingDeletedMock.mockResolvedValueOnce({
      name: "IV",
      isDeleted: false,
    });
    findByNameIncludingDeletedMock.mockResolvedValueOnce({
      name: "IV",
      isDeleted: false,
    });
    await expect(
      ensureSystemTypeNameIsUnique(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "IV"),
    ).rejects.toThrow(BadRequestError);
    await expect(
      ensureSystemTypeNameIsUnique(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "IV"),
    ).rejects.toThrow(
      `${SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION} "IV" already exists`,
    );

    findByNameIncludingDeletedMock.mockResolvedValueOnce({
      name: "IV",
      isDeleted: true,
    });
    await expect(
      ensureSystemTypeNameIsUnique(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "IV"),
    ).rejects.toThrow(
      `${SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION} "IV" already exists and is deleted`,
    );
  });

  it("builds create payloads for regular system types", () => {
    expect(
      toCreateSystemTypePayload(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, {
        name: "  IV ",
        isDeleted: true,
        serialId: "ROA-1",
      }),
    ).toEqual({
      name: "IV",
      serialId: "ROA-1",
      isDeleted: false,
    });
  });

  it("normalizes create payloads for animal vitals", () => {
    expect(
      toCreateSystemTypePayload(SYSTEM_TYPE_NAMES.ANIMAL_VITALS, {
        name: "  Temperature  ",
        minValue: 37,
        maxValue: 39,
      }),
    ).toEqual({
      name: "Temperature",
      vitalsType: "Temperature",
      rangeMin: 37,
      rangeMax: 39,
      isDeleted: false,
    });
  });

  it("builds update payloads for both regular and animal vital types", () => {
    expect(
      toUpdateSystemTypePayload(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, {
        name: "  IM ",
        isDeleted: true,
      }),
    ).toEqual({
      name: "IM",
    });

    expect(
      toUpdateSystemTypePayload(SYSTEM_TYPE_NAMES.ANIMAL_VITALS, {
        vitalsType: "  Pulse ",
        minValue: 60,
        maxValue: 100,
      }),
    ).toEqual({
      vitalsType: "Pulse",
      name: "Pulse",
      rangeMin: 60,
      rangeMax: 100,
    });
  });
});
