import { useQuery } from "@tanstack/react-query";
import { tableApi } from "../table.api";
import type { GetTableDataDTO } from "@petec/shared";
import { tableKeys } from "./table.keys";

export const useTableData = (dto: GetTableDataDTO, enabled = true) =>
    useQuery({
        queryKey: tableKeys.data(dto),
        queryFn: () => tableApi.getTableData(dto),
        enabled,
    });
