import { z } from "zod";
import {
    PAGINATION,
    SortOrders,
    SORT_ORDER_VALUES,
    TABLE_ALLOW_LIST,
    TABLE_DEFAULT_SORT_BY,
} from "../constants/index";
import { PatientCardRowDTOSchema } from "./patient.dto";

const filterScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const filterValueSchema: z.ZodType<
    string | number | boolean | null | Record<string, string | number | boolean | null>
> = z.union([filterScalarSchema, z.record(z.string(), filterScalarSchema)]);

export const GetTableDataDTOSchema = z.object({
    tableName: z.enum(TABLE_ALLOW_LIST),
    filters: z.record(z.string(), filterValueSchema).default({}),
    page: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).default(PAGINATION.DEFAULT_PAGE),
    limit: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    sortBy: z.string().default(TABLE_DEFAULT_SORT_BY),
    sortOrder: z.enum(SORT_ORDER_VALUES).default(SortOrders.DESC),
    args: z.array(z.string()).optional(),
}).strict();

export const TableDataRowDTOSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

export const createTableDataResponseSchema = <TItem extends z.ZodType>(itemSchema: TItem) => z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
}).strict();

export const TableDataResponseDTOSchema = createTableDataResponseSchema(TableDataRowDTOSchema);
export const PatientCardTableDataResponseDTOSchema = createTableDataResponseSchema(PatientCardRowDTOSchema);
