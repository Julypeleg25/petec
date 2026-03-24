import { Response } from "express";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import TableService from "../services/TableService";
import logger from "../../api/utils/Logger";

class TableController {
  async getTableData(req: AuthRequest, res: Response) {
    try {
      const {
        rowsPerPage,
        pageNumber,
        query,
        filters,
        orderBy,
        args,
        formatting,
        variables,
      } = req.body;
      const tableData = await TableService.getTableData(
        rowsPerPage,
        pageNumber,
        query,
        filters,
        orderBy,
        args,
        formatting,
        variables
      );

      res.status(200).json(tableData);
    } catch (err: any) {
      logger.error("Failed to get table data: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

export default new TableController();
