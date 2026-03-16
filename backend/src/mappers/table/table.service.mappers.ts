import type { AllowedTableName, PaginatedResponse } from "@petec/shared";
import { BadRequestError } from "@constants/error.constants";
import type { CollectionHandler, TableRow, TableKey } from "./table.mappers.types";

export const ensureAllowedTableName = (
  tableName: AllowedTableName,
  allowedTableNames: ReadonlySet<AllowedTableName>,
): void => {
  if (!allowedTableNames.has(tableName)) {
    throw new BadRequestError(`Table "${tableName}" is not valid`);
  }
};

export const resolveTableHandler = (
  tableName: AllowedTableName,
  handlers: Readonly<Record<TableKey, CollectionHandler<TableRow>>>,
): CollectionHandler<TableRow> => {
  const handler = handlers[tableName];
  if (!handler) {
    throw new BadRequestError(`Table "${tableName}" handler not found`);
  }
  return handler;
};

export const buildPaginatedTableResponse = <TItem extends TableRow>(
  items: ReadonlyArray<TItem>,
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<TItem> => ({
  items: [...items],
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
