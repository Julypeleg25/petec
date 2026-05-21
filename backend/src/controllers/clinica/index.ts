import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@petec/shared";
import { clinicaClientService } from "../../services/clinica/clinicaClient.service.js";

const getClients = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.getClients({
      search: req.query.search as string | undefined,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getClientByExternalPatientId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result =
      await clinicaClientService.getClientByExternalPatientId(
        String(req.params.externalPatientId),
      );

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const syncClients = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.syncClients();

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSyncStatus = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(HttpStatus.OK).json({
    success: true,
    data: clinicaClientService.getSyncStatus(),
  });
};

export const clinicaController = {
  getClientByExternalPatientId,
  getClients,
  getSyncStatus,
  syncClients,
};
