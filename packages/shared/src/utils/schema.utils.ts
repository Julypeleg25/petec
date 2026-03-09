import { z } from "zod";
import {
  PAGINATION,
  SortOrders,
  SORT_ORDER_VALUES,
  TABLE_DEFAULT_SORT_BY,
} from "../constants/index";

export const dateCoerceSchema = z.coerce.date();

export const optionalDateCoerceSchema = z.coerce.date().optional();

export const nullableOptionalDateCoerceSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.null().or(z.coerce.date()).optional(),
);

export const CASE_SERIAL_ID_REGEX = /^(\d{3,})-(\d{6,})$/;

export const getCaseSerialPrefix = (value: string): string | null => {
  const match = CASE_SERIAL_ID_REGEX.exec(value.trim());
  if (!match) {
    return null;
  }
  return match[1] ?? null;
};

export const caseSerialIdSchema = z
  .string()
  .trim()
  .regex(CASE_SERIAL_ID_REGEX, "פורמט מספר תיק לא תקין");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const sortSchema = z.object({
  sortBy: z.string().default(TABLE_DEFAULT_SORT_BY),
  sortOrder: z.enum(SORT_ORDER_VALUES).default(SortOrders.DESC),
});

export type SortInput = z.infer<typeof sortSchema>;
