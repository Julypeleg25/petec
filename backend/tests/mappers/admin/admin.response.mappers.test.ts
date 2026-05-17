import { jest } from "@jest/globals";

const toMapperIdStringMock = jest.fn<(value: unknown) => string>();

jest.unstable_mockModule("../../../src/mappers/common/common.mappers.utils.js", () => ({
  toMapperIdString: toMapperIdStringMock,
}));

const {
  toSimpleSystemTypeDTO,
  toRaceTypeDTO,
  toAnimalVitalDTO,
} = await import("../../../src/mappers/admin/admin.response.mappers.js");

describe("admin.response.mappers", () => {
  beforeEach(() => {
    toMapperIdStringMock.mockReset();
  });

  it("maps simple system types", () => {
    toMapperIdStringMock.mockReturnValueOnce("lookup-1");

    expect(
      toSimpleSystemTypeDTO({
        _id: "lookup-1",
        name: "IV",
        isDeleted: true,
        serialId: "ROA-1",
      } as never),
    ).toEqual({
      id: "lookup-1",
      name: "IV",
      isDeleted: true,
      serialId: "ROA-1",
    });
  });

  it("maps race types with their animal type reference", () => {
    toMapperIdStringMock.mockReturnValueOnce("race-1").mockReturnValueOnce(
      "animal-1",
    );

    expect(
      toRaceTypeDTO({
        _id: "race-1",
        name: "Labrador",
        animalTypeId: "animal-1",
      } as never),
    ).toEqual({
      id: "race-1",
      name: "Labrador",
      isDeleted: undefined,
      serialId: undefined,
      animalTypeId: "animal-1",
    });
  });

  it("maps animal vitals with ranges and the animal type reference", () => {
    toMapperIdStringMock.mockReturnValueOnce("vital-1").mockReturnValueOnce(
      "animal-1",
    );

    expect(
      toAnimalVitalDTO({
        _id: "vital-1",
        name: "Temperature",
        animalTypeId: "animal-1",
        vitalsType: "Temperature",
        rangeMin: 37,
        rangeMax: 39,
      } as never),
    ).toEqual({
      id: "vital-1",
      name: "Temperature",
      isDeleted: undefined,
      serialId: undefined,
      animalTypeId: "animal-1",
      vitalsType: "Temperature",
      rangeMin: 37,
      rangeMax: 39,
    });
  });
});
