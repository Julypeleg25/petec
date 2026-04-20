import {
  mapMedicineDocToDto,
  mapSimpleTypeDocToDto,
  toPopulatedReference,
} from "../../../src/mappers/medicine/medicine.mappers.js";

describe("medicine.mappers", () => {
  it("maps populated references safely", () => {
    expect(toPopulatedReference(undefined)).toBeUndefined();
    expect(
      toPopulatedReference({
        _id: { toString: () => "lookup-1" },
        name: "Ampoule",
        description: "Sterile",
        serialId: "MU-1",
        isDeleted: false,
        type: "measureUnitType",
        createdAt: new Date("2026-04-19T07:30:00.000Z"),
        updatedAt: new Date("2026-04-19T08:30:00.000Z"),
      } as never),
    ).toEqual({
      id: "lookup-1",
      name: "Ampoule",
      description: "Sterile",
      serialId: "MU-1",
      isDeleted: false,
      type: "measureUnitType",
      createdAt: "2026-04-19T07:30:00.000Z",
      updatedAt: "2026-04-19T08:30:00.000Z",
    });
  });

  it("maps medicine documents to dtos", () => {
    expect(
      mapMedicineDocToDto({
        _id: { toString: () => "med-1" },
        name: "Ketamine",
        description: "Sedative",
        isDeleted: false,
        serialId: "MED-1",
        measureUnitTypeId: {
          _id: "measure-1",
          name: "ml",
        },
        rangeMax: 2,
        rangeMin: 1,
        totalDose: 10,
        comments: "Handle carefully",
        routeOfAdministrationId: {
          _id: "route-1",
          name: "IV",
        },
        dosageFrequencyId: null,
        categoryId: {
          _id: "category-1",
          name: "Sedation",
        },
        defaultUnit: "ml",
      } as never),
    ).toEqual({
      id: "med-1",
      name: "Ketamine",
      description: "Sedative",
      isDeleted: false,
      serialId: "MED-1",
      measureUnitType: {
        id: "measure-1",
        name: "ml",
        description: null,
        serialId: undefined,
        isDeleted: undefined,
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      },
      rangeMax: 2,
      rangeMin: 1,
      totalDose: 10,
      comments: "Handle carefully",
      routeOfAdministration: {
        id: "route-1",
        name: "IV",
        description: null,
        serialId: undefined,
        isDeleted: undefined,
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      },
      dosageFrequency: undefined,
      category: {
        id: "category-1",
        name: "Sedation",
        description: null,
        serialId: undefined,
        isDeleted: undefined,
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      },
      defaultUnit: "ml",
    });
  });

  it("maps simple type documents to dtos", () => {
    expect(
      mapSimpleTypeDocToDto({
        _id: { toString: () => "type-1" },
        name: "IV",
        description: "Intravenous",
        isDeleted: false,
        serialId: "ROA-1",
      } as never),
    ).toEqual({
      id: "type-1",
      name: "IV",
      description: "Intravenous",
      isDeleted: false,
      serialId: "ROA-1",
    });
  });
});