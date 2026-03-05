import type { Request, Response, NextFunction } from "express";
import { tableService } from "@services/table.service";
import { sendSuccess } from "@utils/apiResponse";
import { getValidatedBody } from "@utils/request.utils";
import type { GetTableDataDTO } from "@petec/shared";
import {
  SYSTEM_TYPE_NAMES,
  TableDataResponseDTOSchema,
  PatientCardTableDataResponseDTOSchema,
  createTableDataResponseSchema,
  AdminMedicineRowDTOSchema,
} from "@petec/shared";

const AdminMedicineTableDataResponseDTOSchema = createTableDataResponseSchema(
  AdminMedicineRowDTOSchema,
);

export class TableController {
  async getTableData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<GetTableDataDTO>(req);
      const result = await tableService.getTableData(
        dto.tableName,
        dto.filters,
        dto.page,
        dto.limit,
        dto.sortBy,
        dto.sortOrder,
      );
      if (dto.tableName === "patients" || dto.tableName === "cases") {
        sendSuccess(res, result, PatientCardTableDataResponseDTOSchema);
        return;
      }
      if (dto.tableName === SYSTEM_TYPE_NAMES.MEDICINES) {
        sendSuccess(res, result, AdminMedicineTableDataResponseDTOSchema);
        return;
      }
      sendSuccess(res, result, TableDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }
}

export const tableController = new TableController();
