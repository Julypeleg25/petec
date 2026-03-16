import type { GetTableDataDTO } from "@petec/shared";

export const tableKeys = {
  all: ["table"] as const,
  data: (dto: GetTableDataDTO) =>
    ["table", dto.tableName, dto.page, dto.limit, dto.sortBy, dto.sortOrder, dto.filters] as const,
};
