import { Types } from "mongoose";
import { ValidationError } from "../../../../src/constants/error.constants.js";
import {
  normalizeCaseDetailsGrid,
  toGridValidationDetails,
  validateCaseDetailsGrid,
} from "../../../../src/services/patient/utils/caseGridService.utils.js";

describe("caseGridService.utils", () => {
  it("normalizes nested grid rows, applies defaults, and sorts by date/time/index", () => {
    const laterId = new Types.ObjectId();

    const normalized = normalizeCaseDetailsGrid([
      [
        {
          _id: laterId,
          date: "2026-04-21",
          time: "9:05",
          index: "2",
          foodGiven: true,
          waterGiven: true,
          fluids: [{}],
          medicines: [{}],
          procedures: [{}],
          examinations: [{}],
          foodExtras: [{}],
        },
        {
          date: "2026-04-21T17:15:00.000Z",
          time: "09:05:59",
          index: 1,
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        },
      ],
      [
        {
          dateTime: new Date(2026, 3, 20, 8, 30, 0),
          index: 1,
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        },
      ],
    ] as never);

    expect(normalized).toHaveLength(3);
    expect(normalized.map((row) => `${row.date} ${row.time} ${row.index}`)).toEqual([
      "2026-04-20 08:30 1",
      "2026-04-21 09:05 1",
      "2026-04-21 09:05 2",
    ]);

    expect(normalized[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[0]?.temperatureIsRequired).toBe(false);
    expect(normalized[0]?.temperatureIsEditable).toBe(true);

    expect(normalized[2]?.foodAndWater).toContain("+");
    expect(normalized[2]?.fluids[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[2]?.medicines[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[2]?.procedures[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[2]?.examinations[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[2]?.foodExtras[0]?._id).toBeInstanceOf(Types.ObjectId);
    expect(normalized[2]?._id?.toString()).toBe(laterId.toString());
  });

  it("preserves explicit foodAndWater values and coerces invalid indexes to zero", () => {
    const [row] = normalizeCaseDetailsGrid([
      {
        date: "2026-04-22",
        time: "10:10",
        index: "not-a-number",
        foodAndWater: "served manually",
        fluids: [],
        medicines: [],
        procedures: [],
        examinations: [],
        foodExtras: [],
      },
    ] as never);

    expect(row?.foodAndWater).toBe("served manually");
    expect(row?.index).toBe(0);
  });

  it("throws a validation error for invalid time values", () => {
    expect(() =>
      normalizeCaseDetailsGrid([
        {
          date: "2026-04-21",
          time: "25:99",
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        },
      ] as never),
    ).toThrow(ValidationError);
  });

  it("throws a validation error when a row date is missing", () => {
    expect(() =>
      normalizeCaseDetailsGrid([
        {
          time: "08:00",
          dateTime: "not-a-date",
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        },
      ] as never),
    ).toThrow("Row date is required");
  });

  it("throws a validation error when a row time is missing", () => {
    expect(() =>
      normalizeCaseDetailsGrid([
        {
          date: "2026-04-21",
          dateTime: "not-a-date",
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        },
      ] as never),
    ).toThrow("Row time is required");
  });

  it("groups validation issues by their path", () => {
    expect(
      toGridValidationDetails([
        { path: "rows.0.time", message: "missing" },
        { path: "rows.0.time", message: "invalid" },
        { path: "rows.1.date", message: "missing" },
      ]),
    ).toEqual({
      "rows.0.time": ["missing", "invalid"],
      "rows.1.date": ["missing"],
    });
  });

  it("currently returns no validation issues for normalized rows", () => {
    expect(validateCaseDetailsGrid([] as never)).toEqual([]);
  });
});
