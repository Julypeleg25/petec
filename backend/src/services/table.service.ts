import type { AllowedTableName, PaginatedResponse, SortOrder } from "@petec/shared";
import { TABLE_ALLOW_LIST } from "@petec/shared";
import { BadRequestError } from "@utils/errors";
import { TABLE_HANDLERS } from "@mappers/table.mappers";
import type { MongoFilter } from "@utils/types";

const ALLOWED_TABLE_NAMES = new Set<AllowedTableName>(TABLE_ALLOW_LIST);

export class TableService {
    async getTableData<T extends Record<string, string | number | boolean | null> = Record<string, string | number | boolean | null>>(
        tableName: AllowedTableName,
        filters: MongoFilter,
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: SortOrder,
    ): Promise<PaginatedResponse<T>> {
        if (!ALLOWED_TABLE_NAMES.has(tableName)) {
            throw new BadRequestError(`Table "${tableName}" is not allowed`);
        }

        const handler = TABLE_HANDLERS[tableName];

        if (!handler) {
            throw new BadRequestError(`Table "${tableName}" handler not found`);
        }

        const [items, total] = await Promise.all([
            handler.find(filters, { page, limit, sortBy, sortOrder }),
            handler.count(filters),
        ]);

        return {
            items: items as T[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    };
}

export const tableService = new TableService();
