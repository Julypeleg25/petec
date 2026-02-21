import type { Request, Response, NextFunction } from "express";
import { tableService } from "@services/table.service";
import { sendSuccess } from "@utils/apiResponse";
import { getValidatedBody } from "@utils/request.utils";
import { logger } from "@utils/logger";
import type { GetTableDataDTO } from "@petec/shared";
import { TableDataResponseDTOSchema, PatientCardTableDataResponseDTOSchema } from "@petec/shared";

export class TableController {
  async getTableData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<GetTableDataDTO>(req);
      logger.debug("table_get_data_request", {
        tableName: dto.tableName,
        page: dto.page,
        limit: dto.limit,
      });
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
      sendSuccess(res, result, TableDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }
}

export const tableController = new TableController();
