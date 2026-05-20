import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import {
  CASE_SEARCH_RESULT_LIMIT,
  CASE_TEXT_FILTER_KEYS,
  SYSTEM_TYPE_FIELD_MAP,
  SYSTEM_TYPE_NUMERIC_FIELDS,
  SYSTEM_TYPE_REFERENCE_FILTER_TARGETS,
  USER_FILTER_KEY_MAP,
} from "../../../src/mappers/table/table.mappers.constants.js";

describe("table.mappers.constants", () => {
  it("exposes the expected case search and filter mappings", () => {
    expect(CASE_SEARCH_RESULT_LIMIT).toBe(1000);
    expect(CASE_TEXT_FILTER_KEYS).toEqual({
      SERIAL_ID: "serialId",
      PATIENT_NAME: "patientId.name",
      OWNER_PHONE: "patientId.owner.phone",
    });
    expect(USER_FILTER_KEY_MAP).toEqual({
      first_name: "firstName",
      last_name: "lastName",
      role_name: "role",
    });
  });

  it("maps system-type fields and lookup targets", () => {
    expect(SYSTEM_TYPE_FIELD_MAP.measure_unit).toBe("measureUnitTypeId");
    expect(SYSTEM_TYPE_FIELD_MAP.medicine_category).toBe("categoryId");
    expect(SYSTEM_TYPE_FIELD_MAP.vitals_type).toBe("vitalsType");

    expect(SYSTEM_TYPE_REFERENCE_FILTER_TARGETS).toEqual({
      animal_type: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
      medicine_category: SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
      measure_unit: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
      dosage_frequency: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
      route_of_administration: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    });
  });

  it("tracks numeric system-type fields in a set", () => {
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("rangeMin")).toBe(true);
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("rangeMax")).toBe(true);
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("totalDose")).toBe(true);
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("minValue")).toBe(true);
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("maxValue")).toBe(true);
    expect(SYSTEM_TYPE_NUMERIC_FIELDS.has("name")).toBe(false);
  });
});
