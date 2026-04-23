import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@utils/apiResponse";
import { clinicaQueryImportService } from "@services/clinicaQueryImport.service";

export class ClinicaController {
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

      const result = await clinicaQueryImportService.run({
        username,
        password,
        query,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const clinicaController = new ClinicaController();