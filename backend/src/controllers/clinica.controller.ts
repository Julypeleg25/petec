import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../utils/apiResponse.js";
import { clinicaQueryImportService } from "../services/clinicaQueryImport.service.js";

class ClinicaController {
  async queryImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        username,
        password,
        query,
      } = req.body as {
        username?: string;
        password?: string;
        query?: string;
      };

      if (!username || !password || !query) {
        throw new Error("username, password and query are required");
      }

      const result = await clinicaQueryImportService.runQueryImport({
        username,
        password,
        query,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async syncAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        username,
        password,
      } = req.body as {
        username?: string;
        password?: string;
      };

      if (!username || !password) {
        throw new Error("username and password are required");
      }

      const result = await clinicaQueryImportService.runFullSync({
        username,
        password,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const clinicaController = new ClinicaController();