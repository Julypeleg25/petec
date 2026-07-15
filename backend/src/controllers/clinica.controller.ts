import type { Request, Response } from "express";
import { clinicaQueryImportService } from "../services/clinicaQueryImport.service.js";

const syncAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await clinicaQueryImportService.runFullSync();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

export const clinicaController = {
  syncAll,
};
