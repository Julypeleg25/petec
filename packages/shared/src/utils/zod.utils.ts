import { z } from "zod";
import { objectIdSchema } from "./index.js";

export const optionalNullableNonNegativeNumberInputSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (typeof value === "number") {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z.union([
    z.number({ error: "יש להזין מספר תקין" }).min(
      0,
      "הערך חייב להיות גדול או שווה ל-0",
    ),
    z.null(),
  ]),
);

export const optionalNullableObjectIdInputSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([objectIdSchema, z.null(), z.undefined()]),
);

export const numberStringSchema = (label: string, min?: number, required?: boolean) =>
  z
    .string()
    .trim()
    .refine((value) => (required ? value.length > 0 : true), {
      message: `${label} הוא שדה חובה`,
    })
    .refine(
      (value) =>
        value.length === 0 ? true : Number.isFinite(Number(value)),
      {
        message: `${label} חייב להיות מספר תקין`,
      },
    )
    .refine(
      (value) => {
        if (value.length === 0 || min === undefined) return true;
        return Number(value) >= min;
      },
      {
        message: `${label} חייב להיות גדול או שווה ל-${min ?? 0}`,
      },
    );
