import type { z } from "zod";
import {
  formatZodIssuesForLog,
  toValidationErrorDetails,
} from "../../src/utils/zodError.utils.js";

const asIssue = (issue: Record<string, unknown>): z.ZodIssue =>
  issue as unknown as z.ZodIssue;

describe("zodError.utils", () => {
  it("formats zod issues for structured logging", () => {
    const issues = [
      asIssue({
        code: "invalid_type",
        message: "Expected string",
        path: ["patient", 0, "name"],
        expected: "string",
        received: { type: "missing" },
      }),
      asIssue({
        code: "too_small",
        message: "Must be at least 1",
        path: ["patient", 0, "age"],
        minimum: 1,
        inclusive: true,
        exact: false,
      }),
      asIssue({
        code: "unrecognized_keys",
        message: "Unexpected keys",
        path: ["patient"],
        keys: ["zeta", "alpha"],
      }),
      asIssue({
        code: "invalid_string",
        message: "Phone format is invalid",
        path: ["contact", "phone-number"],
        origin: "string",
        format: "regex",
        pattern: "^\\d+$",
      }),
      asIssue({
        code: "custom",
        message: "Symbol path issue",
        path: [Symbol("meta")],
      }),
      asIssue({
        code: "custom",
        message: "Root issue",
        path: [],
      }),
    ];

    const formatted = formatZodIssuesForLog(issues);

    expect(formatted.zod_issue_count).toBe(6);
    expect(formatted.zod_issue_paths).toEqual([
      "_root",
      "contact[\"phone-number\"]",
      "patient",
      "patient[0].age",
      "patient[0].name",
      "Symbol(meta)",
    ]);
    expect(formatted.zod_issue_code_counts).toEqual({
      custom: 2,
      invalid_string: 1,
      invalid_type: 1,
      too_small: 1,
      unrecognized_keys: 1,
    });
    expect(formatted.zod_issue_truncated_count).toBe(0);
    expect(formatted.zod_issues_by_path).toEqual([
      {
        path: "_root",
        issue_count: 1,
        codes: ["custom"],
        messages: ["Root issue"],
      },
      {
        path: "contact[\"phone-number\"]",
        issue_count: 1,
        codes: ["invalid_string"],
        messages: ["Phone format is invalid"],
      },
      {
        path: "patient",
        issue_count: 1,
        codes: ["unrecognized_keys"],
        messages: ["Unexpected keys"],
      },
      {
        path: "patient[0].age",
        issue_count: 1,
        codes: ["too_small"],
        messages: ["Must be at least 1"],
      },
      {
        path: "patient[0].name",
        issue_count: 1,
        codes: ["invalid_type"],
        messages: ["Expected string"],
      },
      {
        path: "Symbol(meta)",
        issue_count: 1,
        codes: ["custom"],
        messages: ["Symbol path issue"],
      },
    ]);
    expect(formatted.zod_issues).toEqual([
      {
        index: 5,
        path: "_root",
        code: "custom",
        message: "Root issue",
      },
      {
        index: 3,
        path: "contact[\"phone-number\"]",
        code: "invalid_string",
        message: "Phone format is invalid",
        origin: "string",
        format: "regex",
        pattern: "^\\d+$",
      },
      {
        index: 2,
        path: "patient",
        code: "unrecognized_keys",
        message: "Unexpected keys",
        keys: ["alpha", "zeta"],
      },
      {
        index: 1,
        path: "patient[0].age",
        code: "too_small",
        message: "Must be at least 1",
        minimum: 1,
        inclusive: true,
        exact: false,
      },
      {
        index: 0,
        path: "patient[0].name",
        code: "invalid_type",
        message: "Expected string",
        expected: "string",
        received: "{\"type\":\"missing\"}",
      },
      {
        index: 4,
        path: "Symbol(meta)",
        code: "custom",
        message: "Symbol path issue",
      },
    ]);
  });

  it("truncates detailed log output after fifty issues", () => {
    const issues = Array.from({ length: 52 }, (_, index) =>
      asIssue({
        code: "custom",
        message: `Issue ${index}`,
        path: ["items", index],
      }),
    );

    const formatted = formatZodIssuesForLog(issues);

    expect(formatted.zod_issue_count).toBe(52);
    expect(formatted.zod_issue_truncated_count).toBe(2);
    expect(formatted.zod_issues).toHaveLength(50);
    expect(formatted.zod_issues[0]).toEqual({
      index: 0,
      path: "items[0]",
      code: "custom",
      message: "Issue 0",
    });
  });

  it("groups validation details by path with sorted unique messages", () => {
    const issues = [
      asIssue({
        code: "custom",
        message: "Required",
        path: ["patient", 0, "name"],
      }),
      asIssue({
        code: "custom",
        message: "Must be at least 2 characters",
        path: ["patient", 0, "name"],
      }),
      asIssue({
        code: "custom",
        message: "Required",
        path: ["patient", 0, "name"],
      }),
      asIssue({
        code: "custom",
        message: "Invalid phone",
        path: ["contact", "phone-number"],
      }),
      asIssue({
        code: "custom",
        message: "General failure",
        path: [],
      }),
    ];

    const details = toValidationErrorDetails(issues);

    expect(Object.keys(details)).toEqual([
      "_root",
      "contact[\"phone-number\"]",
      "patient[0].name",
    ]);
    expect(details).toEqual({
      _root: ["General failure"],
      "contact[\"phone-number\"]": ["Invalid phone"],
      "patient[0].name": [
        "Must be at least 2 characters",
        "Required",
      ],
    });
  });
});