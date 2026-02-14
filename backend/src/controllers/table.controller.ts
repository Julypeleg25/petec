import { Request, Response, NextFunction } from "express";
import { tableService } from "@services/table.service";
import { sendSuccess } from "@utils/apiResponse";
import type { GetTableDataDTO, AllowedTableName } from "@petec/shared";

export class TableController {
    async getTableData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as GetTableDataDTO;
            const result = await tableService.getTableData(
                dto.tableName as AllowedTableName,
                dto.filters,
                dto.page,
                dto.limit,
                dto.sortBy,
                dto.sortOrder,
            );
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };
}

export const tableController = new TableController();
