import { requestWithRequestAndResponseSchema } from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";
import {
    GetTableDataDTOSchema,
    TableDataResponseDTOSchema,
    PatientCardTableDataResponseDTOSchema,
} from "@petec/shared";
import type { GetTableDataDTO, TableDataResponseDTO, PatientCardTableDataResponseDTO } from "@petec/shared";

export const tableApi = {
    getTableData: (dto: GetTableDataDTO): Promise<TableDataResponseDTO | PatientCardTableDataResponseDTO> => {
        if (dto.tableName === "patients" || dto.tableName === "cases") {
            return requestWithRequestAndResponseSchema(
                { method: HTTP_METHODS.POST, url: API_ROUTES.table.getData },
                dto,
                GetTableDataDTOSchema,
                PatientCardTableDataResponseDTOSchema,
            );
        }

        return requestWithRequestAndResponseSchema(
            { method: HTTP_METHODS.POST, url: API_ROUTES.table.getData },
            dto,
            GetTableDataDTOSchema,
            TableDataResponseDTOSchema,
        );
    },
};
