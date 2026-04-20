import { jest } from "@jest/globals";
import {
  DURATION_PATTERN,
  normalizeDurationString,
  parseDurationToMilliseconds,
} from "../../src/config/config.utils.js";

describe("config.utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes supported duration strings", () => {
    expect(normalizeDurationString(" 7D ")).toBe("7d");
    expect(normalizeDurationString("15m")).toBe("15m");
  });

  it("rejects invalid duration strings", () => {
    expect(() => normalizeDurationString("forever")).toThrow(
      "Invalid duration value: forever",
    );
  });

  it.each([
    ["15ms", 15],
    ["2s", 2_000],
    ["3m", 180_000],
    ["4h", 14_400_000],
    ["5d", 432_000_000],
    ["6w", 3_628_800_000],
  ] as const)(
    "parses %s into milliseconds",
    (value, expected) => {
      expect(parseDurationToMilliseconds(value)).toBe(expected);
    },
  );

  it("rejects invalid parse inputs", () => {
    expect(() =>
      parseDurationToMilliseconds("oops" as never),
    ).toThrow("Invalid duration value: oops");
  });

  it("guards against unsupported duration units", () => {
    jest.spyOn(DURATION_PATTERN, "exec").mockReturnValue([
      "9q",
      "9",
      "q",
    ] as unknown as RegExpExecArray);

    expect(() =>
      parseDurationToMilliseconds("9q" as never),
    ).toThrow("Unsupported duration unit: q");
  });
});