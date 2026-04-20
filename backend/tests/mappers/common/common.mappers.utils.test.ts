import { Types } from "mongoose";
import {
  toBooleanOrNull,
  toBooleanWithDefault,
  toCanonicalJerusalemDate,
  toDateInputString,
  toFiniteNumber,
  toGiven,
  toIsoDateString,
  toLocalDateKey,
  toMapperIdString,
  toMapperNamedReference,
  toNormalizedDate,
  toNormalizedTime,
  toNullableFiniteNumber,
  toNullableIsoDateString,
  toNullableTrimmedString,
  toOptionalBoolean,
  toOptionalString,
  toParsedDate,
  toStringOrNull,
  toTimeKey,
  toTwoDigits,
} from "../../../src/mappers/common/common.mappers.utils.js";

describe("common.mappers.utils", () => {
  it("formats date and time helper values", () => {
    const date = new Date(2026, 3, 19, 9, 7, 0);

    expect(toTwoDigits(3)).toBe("03");
    expect(toLocalDateKey(date)).toBe("2026-04-19");
    expect(toTimeKey(date)).toBe("09:07");
  });

  it("normalizes mapper id values across supported shapes", () => {
    const objectId = new Types.ObjectId();
    const selfRef: { _id?: unknown } = {};
    selfRef._id = selfRef;

    expect(toMapperIdString(null)).toBe("");
    expect(toMapperIdString("abc")).toBe("abc");
    expect(toMapperIdString(42)).toBe("42");
    expect(toMapperIdString({ id: "nested-id" } as never)).toBe("nested-id");
    expect(toMapperIdString({ _id: { _id: objectId } } as never)).toBe(
      objectId.toString(),
    );
    expect(toMapperIdString(selfRef as never)).toBe("[object Object]");
  });

  it("converts date values to iso strings", () => {
    const date = new Date("2026-04-19T07:30:00.000Z");

    expect(toIsoDateString(date)).toBe("2026-04-19T07:30:00.000Z");
    expect(toIsoDateString("2026-04-19T07:30:00.000Z")).toBe(
      "2026-04-19T07:30:00.000Z",
    );
    expect(toIsoDateString("nope")).toBeUndefined();
    expect(toNullableIsoDateString(null)).toBeNull();
  });

  it("derives jerusalem-aware date input strings and canonical dates", () => {
    expect(toDateInputString("2026-04-19")).toBe("2026-04-19");
    expect(toDateInputString("2026-04-19T23:30:00.000Z")).toBe("2026-04-20");
    expect(toDateInputString(new Date("2026-04-19T23:30:00.000Z"))).toBe(
      "2026-04-20",
    );
    expect(toDateInputString("invalid-date")).toBeUndefined();

    expect(toCanonicalJerusalemDate("2026-04-20")).toEqual(
      new Date(Date.UTC(2026, 3, 20, 12, 0, 0, 0)),
    );
    expect(toCanonicalJerusalemDate(undefined)).toBeUndefined();
  });

  it("maps named references and nullable primitive helpers", () => {
    expect(
      toMapperNamedReference({ _id: { _id: "lookup-1" }, name: "Lookup" }),
    ).toEqual({
      id: "lookup-1",
      name: "Lookup",
    });
    expect(toMapperNamedReference("raw-id")).toEqual({
      id: "raw-id",
      name: "",
    });

    expect(toNullableTrimmedString("  hello  ")).toBe("hello");
    expect(toNullableTrimmedString("   ")).toBeNull();
    expect(toNullableFiniteNumber(5)).toBe(5);
    expect(toNullableFiniteNumber(Number.NaN)).toBeNull();
    expect(toBooleanWithDefault(undefined, true)).toBe(true);
    expect(toBooleanWithDefault(false, true)).toBe(false);
    expect(toGiven(true)).toBe(true);
    expect(toGiven(false)).toBe(false);
    expect(toOptionalBoolean(true)).toBe(true);
    expect(toOptionalBoolean(null)).toBeUndefined();
    expect(toBooleanOrNull(false)).toBe(false);
    expect(toBooleanOrNull(undefined)).toBeNull();
    expect(toOptionalString("abc")).toBe("abc");
    expect(toOptionalString(null)).toBeUndefined();
    expect(toStringOrNull(42)).toBe("42");
    expect(toStringOrNull(null)).toBeNull();
  });

  it("parses dates and finite numbers safely", () => {
    const date = new Date("2026-04-19T00:00:00.000Z");

    expect(toParsedDate(date)).toBe(date);
    expect(toParsedDate("2026-04-19T00:00:00.000Z")?.toISOString()).toBe(
      "2026-04-19T00:00:00.000Z",
    );
    expect(toParsedDate("bad-date")).toBeNull();
    expect(toParsedDate(undefined)).toBeNull();

    expect(toFiniteNumber(12)).toBe(12);
    expect(toFiniteNumber(" 13.5 ")).toBe(13.5);
    expect(toFiniteNumber("abc")).toBeUndefined();
    expect(toFiniteNumber(null)).toBeUndefined();
  });

  it("normalizes date and time string inputs with fallbacks", () => {
    const fallback = new Date(2026, 3, 19, 8, 5, 0);

    expect(toNormalizedDate("2026-04-19")).toBe("2026-04-19");
    expect(toNormalizedDate("2026-04-19T12:34:56.000Z")).toBe("2026-04-19");
    expect(toNormalizedDate("April 19, 2026")).toBe("2026-04-19");
    expect(toNormalizedDate(undefined, fallback)).toBe("2026-04-19");
    expect(toNormalizedDate("   ", undefined)).toBe("");

    expect(toNormalizedTime("9:05")).toBe("09:05");
    expect(toNormalizedTime(undefined, fallback)).toBe("08:05");
    expect(toNormalizedTime("bad-time", undefined)).toBe("");
  });
});