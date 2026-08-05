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

    const result = clinicaClientService.startSyncClients();

    logger.info("Manual Clinica sync accepted", {
      module: "clinica",
      event: "manual_clinica_sync_accepted",
      request_id: req.requestId,
      result,
    });

    res.status(202).json({
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

const getSyncStatus = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(HttpStatus.OK).json({
    success: true,
    data: clinicaClientService.getSyncStatus(),
  });
};

const getCachedPet = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.getCachedPet(
      String(req.params.clientId),
      String(req.query.petName ?? ""),
    );
    res.status(HttpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const fetchPetVisits = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.fetchMissingVisitDetails(
      String(req.params.clientId),
      String(req.body?.petName ?? ""),
      req.body?.forcePatientDetails === true,
    );
    res.status(HttpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const fetchCaseVisits = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.fetchVisitsForExistingCase(
      String(req.body?.casePrefix ?? ""),
      String(req.body?.petName ?? ""),
      String(req.body?.ownerPhone ?? ""),
      req.body?.forceRefresh === true,
    );
    res.status(HttpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getClientByCasePrefix = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await clinicaClientService.findClientForCasePrefix(
      String(req.query.casePrefix ?? ""),
      String(req.query.petName ?? ""),
      String(req.query.ownerPhone ?? ""),
    );
    res.status(HttpStatus.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
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
  fetchCaseVisits,
  fetchPetVisits,
  getClientByCasePrefix,
  getClientByExternalPatientId,
  getCachedPet,
  getClients,
  getDebugConfig,
  getSyncStatus,
  syncClients,
};
