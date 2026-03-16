import type {
  AllowedTableName,
  PaginatedResponse,
  SortOrder,
} from "@petec/shared";
import { PATIENT_CARD_TABLE_NAMES, TABLE_ALLOW_LIST } from "@petec/shared";
import type { MongoFilter } from "@app-types/global.types";
import { TABLE_HANDLERS } from "@mappers/table/table.mappers";
import type { TableRow } from "@mappers/table/table.mappers.types";
import {
  buildPaginatedTableResponse,
  ensureAllowedTableName,
  resolveTableHandler,
} from "@mappers/table/table.service.mappers";
import { patientCardsTableService } from "@services/table";

const ALLOWED_TABLE_NAMES = new Set<AllowedTableName>(TABLE_ALLOW_LIST);

export class TableService {
  async getTableData(
    tableName: AllowedTableName,
    filters: MongoFilter,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: SortOrder,
  ): Promise<PaginatedResponse<TableRow>> {
    ensureAllowedTableName(tableName, ALLOWED_TABLE_NAMES);
    if (
      PATIENT_CARD_TABLE_NAMES.includes(
        tableName as (typeof PATIENT_CARD_TABLE_NAMES)[number],
      )
    ) {
      return patientCardsTableService.getTableData(
        tableName,
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      ) as Promise<PaginatedResponse<TableRow>>;
    }
    const handler = resolveTableHandler(tableName, TABLE_HANDLERS);

    const [items, total] = await Promise.all([
      handler.find(filters, { page, limit, sortBy, sortOrder }),
      handler.count(filters),
    ]);

    return buildPaginatedTableResponse(items, total, page, limit);
  }
}

export const tableService = new TableService();
