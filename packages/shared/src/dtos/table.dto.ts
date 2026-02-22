import { z } from "zod";
import { TABLE_ALLOW_LIST } from "../constants/index";

export const GetTableDataDTOSchema = z.object({
    tableName: z.enum(TABLE_ALLOW_LIST as unknown as [string, string, ...string[]]),
    filters: z.record(z.string(), z.unknown()).default({}),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type GetTableDataDTO = z.infer<typeof GetTableDataDTOSchema>;
