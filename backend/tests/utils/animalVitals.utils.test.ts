import {
  ANIMAL_VITAL_TYPES,
  buildAnimalVitalsMap,
  getLatestVitalRows,
  isValueInRange,
} from "../../src/utils/animalVitals.utils.js";

describe("animalVitals.utils", () => {
  it("builds a lookup map by vitals type", () => {
    const temperatureVital = {
      vitalsType: ANIMAL_VITAL_TYPES.TEMPERATURE,
      min: 37,
      max: 39,
    };
    const pulseVital = {
      vitalsType: ANIMAL_VITAL_TYPES.PULSE,
      min: 60,
      max: 120,
    };
    const ignoredVital = {
      vitalsType: "",
      min: 0,
      max: 0,
    };

    const result = buildAnimalVitalsMap([
      temperatureVital,
      pulseVital,
      ignoredVital,
    ] as never);

    expect(result).toEqual({
      T: temperatureVital,
      P: pulseVital,
    });
  });

  it("finds the latest row for each vital sign", () => {
    const rows = [
      {
        dateTime: "2026-04-18T08:00:00.000Z",
        temperature: 37.2,
      },
      {
        dateTime: "2026-04-18T09:00:00.000Z",
        pulse: 80,
      },
      {
        dateTime: "2026-04-18T10:00:00.000Z",
        temperature: 38.1,
        respiration: 24,
      },
      {
        dateTime: "2026-04-18T11:00:00.000Z",
        pulse: 88,
      },
    ];

    expect(getLatestVitalRows(rows)).toEqual({
      TRow: rows[2],
      PRow: rows[3],
      RRow: rows[2],
    });
  });

  it("returns null rows when the vital values do not exist", () => {
    const rows = [
      {
        dateTime: "2026-04-18T08:00:00.000Z",
      },
    ];

    expect(getLatestVitalRows(rows)).toEqual({
      TRow: null,
      PRow: null,
      RRow: null,
    });
  });

  it("treats missing ranges and values as in-range", () => {
    expect(isValueInRange(undefined, 1, 5)).toBe(true);
    expect(isValueInRange(null, 1, 5)).toBe(true);
    expect(isValueInRange(3, undefined, 5)).toBe(true);
    expect(isValueInRange(3, 1, undefined)).toBe(true);
  });

  it("checks whether a value is inside the configured range", () => {
    expect(isValueInRange(3, 1, 5)).toBe(true);
    expect(isValueInRange(0, 1, 5)).toBe(false);
    expect(isValueInRange(6, 1, 5)).toBe(false);
  });
});