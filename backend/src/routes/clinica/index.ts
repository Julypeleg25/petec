import { Router } from "express";
import { Permission } from "@petec/shared";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/auth.middleware.js";
import { clinicaController } from "../../controllers/clinica/index.js";
import { CLINICA_ROUTE_PATHS } from "./clinicaRoutes.constants.js";

const router = Router();

router.use(authenticate);

router.get(
  CLINICA_ROUTE_PATHS.clients,
  requirePermission(Permission.READ_PATIENT),
  clinicaController.getClients,
);

router.get(
  CLINICA_ROUTE_PATHS.clientByExternalPatientId,
  requirePermission(Permission.READ_PATIENT),
  clinicaController.getClientByExternalPatientId,
);

router.get(
  CLINICA_ROUTE_PATHS.debugConfig,
  requirePermission(Permission.WILDCARD),
  clinicaController.getDebugConfig,
);

router.get(
  CLINICA_ROUTE_PATHS.syncStatus,
  requirePermission(Permission.READ_PATIENT),
  clinicaController.getSyncStatus,
);

router.post(
  CLINICA_ROUTE_PATHS.syncClients,
  requirePermission(Permission.WRITE_PATIENT),
  clinicaController.syncClients,
);

router.post(
  CLINICA_ROUTE_PATHS.syncClient,
  requirePermission(Permission.WRITE_PATIENT),
  clinicaController.syncClient,
);

export default router;
