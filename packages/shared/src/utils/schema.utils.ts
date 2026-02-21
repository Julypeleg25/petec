import { z } from "zod";
import {
  PAGINATION,
  SortOrders,
  SORT_ORDER_VALUES,
  TABLE_DEFAULT_SORT_BY,
} from "../constants/index";

export const dateCoerceSchema = z.coerce.date();

export const optionalDateCoerceSchema = z.coerce.date().optional();

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
