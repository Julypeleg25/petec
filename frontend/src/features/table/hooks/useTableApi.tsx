import { useQuery } from "@tanstack/react-query";
import { tableApi } from "../table.api";
import type { GetTableDataDTO } from "@petec/shared";

export const tableKeys = {
    all: ["table"] as const,
    data: (dto: GetTableDataDTO) =>
        ["table", dto.tableName, dto.page, dto.limit, dto.sortBy, dto.sortOrder, dto.filters] as const,
};

export const useTableData = (dto: GetTableDataDTO, enabled = true) =>
    useQuery({
        queryKey: tableKeys.data(dto),
        queryFn: () => tableApi.getTableData(dto),
        enabled,
    });
