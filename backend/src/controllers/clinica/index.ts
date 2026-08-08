import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@petec/shared";
import { clinicaClientService } from "../../services/clinica/clinicaClient.service.js";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";

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
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    logger.info("Manual Clinica sync started", {
      module: "clinica",
      event: "manual_clinica_sync_started",
      request_id: req.requestId,
    });

    const result = await clinicaClientService.syncLatestClients();

    logger.info("Manual Clinica sync finished", {
      module: "clinica",
      event: "manual_clinica_sync_finished",
      request_id: req.requestId,
      result,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error("Manual Clinica sync failed", {
      module: "clinica",
      event: "manual_clinica_sync_failed",
      request_id: req.requestId,
      error_name: err.name,
      error_message: err.message,
      error_stack: err.stack,
    });

    next(error);
  }
};

const syncClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const externalPatientId = String(req.params.externalPatientId);

    logger.info("Single client Clinica sync started", {
      module: "clinica",
      event: "single_clinica_sync_started",
      request_id: req.requestId,
      externalPatientId,
    });

    const result = await clinicaClientService.syncOneClient(externalPatientId);

    logger.info("Single client Clinica sync finished", {
      module: "clinica",
      event: "single_clinica_sync_finished",
      request_id: req.requestId,
      externalPatientId,
      result,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error("Single client Clinica sync failed", {
      module: "clinica",
      event: "single_clinica_sync_failed",
      request_id: req.requestId,
      error_name: err.name,
      error_message: err.message,
      error_stack: err.stack,
    });

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

const getDebugConfig = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(HttpStatus.OK).json({
    success: true,
    data: {
      hasClinicaBaseUrl: Boolean(ENV.clinicaBaseUrl),
      hasClinicUsername: Boolean(ENV.clinicUsername),
      hasClinicPassword: Boolean(ENV.clinicPassword),
      nodeEnv: ENV.nodeEnv,
      isProduction: ENV.isProduction,
    },
  });
};

export const clinicaController = {
  getClientByExternalPatientId,
  getClients,
  getDebugConfig,
  getSyncStatus,
  syncClients,
  syncClient,
};
