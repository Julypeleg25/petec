import { jest } from "@jest/globals";
import { Types } from "mongoose";
import { toAdminMedicineRowDTO } from "../../../src/mappers/systemManagement/medicine.admin.mapper.js";

describe("medicine.admin.mapper", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws when a medicine row is missing its id", () => {
    expect(() => toAdminMedicineRowDTO({ name: "Carprofen" })).toThrow(
      "Medicine row is missing _id",
    );
  });

  it("maps medicine admin rows with trimmed values, lookup names, and fallback timestamps", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T10:00:00.000Z"));

    const id = new Types.ObjectId();

    expect(
      toAdminMedicineRowDTO({
        _id: { _id: id },
        serialId: "  MED-1  ",
        name: "  Carprofen  ",
        categoryId: { _id: "cat-1", name: "  NSAID  " },
        measureUnitTypeId: "unit-1",
        dosageFrequencyId: { _id: "freq-1", name: " BID " },
        routeOfAdministrationId: { _id: "route-1", name: null },
        rangeMin: 1,
        rangeMax: Number.NaN,
        totalDose: 2.5,
        comments: "  take with food  ",
        isDeleted: undefined,
        createdAt: undefined,
        updatedAt: "invalid-date",
      }),
    ).toEqual({
      id: id.toString(),
      serial_id: "MED-1",
      name: "Carprofen",
      category_id: "cat-1",
      medicine_category: "NSAID",
      measure_unit_id: "unit-1",
      measure_unit: null,
      dosage_frequency_id: "freq-1",
      dosage_frequency: "BID",
      route_of_administration_id: "route-1",
      route_of_administration: null,
      range_min: 1,
      range_max: null,
      total_dose: 2.5,
      comments: "take with food",
      is_deleted: false,
      created_at: "2026-04-21T10:00:00.000Z",
      updated_at: null,
    });
  });

  it("supports explicit boolean and date fields with unnamed lookup refs", () => {
    const id = new Types.ObjectId();

    expect(
      toAdminMedicineRowDTO({
        _id: id,
        categoryId: { _id: "cat-2" },
        isDeleted: true,
        createdAt: "2026-04-20T00:00:00.000Z",
        updatedAt: new Date("2026-04-21T00:00:00.000Z"),
      }),
    ).toEqual({
      id: id.toString(),
      serial_id: null,
      name: null,
      category_id: "cat-2",
      medicine_category: null,
      measure_unit_id: null,
      measure_unit: null,
      dosage_frequency_id: null,
      dosage_frequency: null,
      route_of_administration_id: null,
      route_of_administration: null,
      range_min: null,
      range_max: null,
      total_dose: null,
      comments: null,
      is_deleted: true,
      created_at: "2026-04-20T00:00:00.000Z",
      updated_at: "2026-04-21T00:00:00.000Z",
    });
  });
});
