import { z } from "zod";
import {
    PAGINATION,
    SortOrders,
    SORT_ORDER_VALUES,
    TABLE_ALLOW_LIST,
    TABLE_DEFAULT_SORT_BY,
} from "../constants/index.js";
import { PatientCardRowDTOSchema } from "./patient.dto.js";

const filterScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const safeMongoFieldPathSchema = z
    .string()
    .min(1)
    .max(100)
    .refine(
        (path) => path.split(".").every((segment) => !segment.startsWith("$")),
        { message: "MongoDB operator paths are not allowed" },
    );

const filtersSchema = z.record(safeMongoFieldPathSchema, filterScalarSchema);

export const GetTableDataDTOSchema = z.object({
    tableName: z.enum(TABLE_ALLOW_LIST),
    filters: filtersSchema.default({}),
    page: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).default(PAGINATION.DEFAULT_PAGE),
    limit: z.coerce.number().int().min(PAGINATION.DEFAULT_PAGE).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    sortBy: safeMongoFieldPathSchema.default(TABLE_DEFAULT_SORT_BY),
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
