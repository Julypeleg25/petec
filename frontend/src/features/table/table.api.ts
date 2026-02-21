import { requestWithRequestAndResponseSchema } from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
import { GetTableDataDTOSchema, TableDataResponseDTOSchema } from "@petec/shared";
import type { GetTableDataDTO, TableDataResponseDTO } from "@petec/shared";

export const tableApi = {
    getTableData: (dto: GetTableDataDTO): Promise<TableDataResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.table.getData },
            dto,
            GetTableDataDTOSchema,
            TableDataResponseDTOSchema,
        ),
};
