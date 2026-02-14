import type { AllowedTableName, PaginatedResponse } from "@petec/shared";
import { TABLE_ALLOW_LIST } from "@petec/shared";
import { BadRequestError } from "@utils/errors";
import { TABLE_HANDLERS } from "@mappers/table.mappers";
import type { MongoFilter } from "@utils/types";

export class TableService {
    async getTableData<T extends Record<string, unknown> = Record<string, unknown>>(
        tableName: AllowedTableName,
        filters: MongoFilter,
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: "asc" | "desc",
    ): Promise<PaginatedResponse<T>> {
        if (!TABLE_ALLOW_LIST.includes(tableName)) {
            throw new BadRequestError(`Table "${tableName}" is not allowed`);
        }

        const handler = TABLE_HANDLERS[tableName];

        if (!handler) {
            throw new BadRequestError(`Table "${tableName}" handler not found`);
        }

        const [items, total] = await Promise.all([
            handler.find(filters, page, limit, sortBy, sortOrder),
            handler.count(filters),
        ]);

        return {
            items: items as unknown as T[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    };
}

export const tableService = new TableService();
