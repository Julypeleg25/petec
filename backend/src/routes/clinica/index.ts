import { Router } from "express";
import { Permission } from "@petec/shared";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/auth.middleware.js";
import { clinicaController } from "../../controllers/clinica/index.js";
import { CLINICA_ROUTE_PATHS } from "./clinicaRoutes.constants.js";
import {
  ClinicaCaseMatchQuerySchema,
  ClinicaCaseVisitsBodySchema,
  ClinicaClientParamsSchema,
  ClinicaClientsQuerySchema,
  ClinicaExternalPatientParamsSchema,
  ClinicaPetQuerySchema,
  ClinicaPetVisitsBodySchema,
} from "./clinica.validation.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);

router.get(
  CLINICA_ROUTE_PATHS.clients,
  requirePermission(Permission.READ_PATIENT),
  validateQuery(ClinicaClientsQuerySchema),
  clinicaController.getClients,
);

router.get(
  CLINICA_ROUTE_PATHS.clientByExternalPatientId,
  requirePermission(Permission.READ_PATIENT),
  validateParams(ClinicaExternalPatientParamsSchema),
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

router.get(
  CLINICA_ROUTE_PATHS.clientByCasePrefix,
  requirePermission(Permission.READ_PATIENT),
  validateQuery(ClinicaCaseMatchQuerySchema),
  clinicaController.getClientByCasePrefix,
);

router.get(
  CLINICA_ROUTE_PATHS.cachedPet,
  requirePermission(Permission.READ_PATIENT),
  validateParams(ClinicaClientParamsSchema),
  validateQuery(ClinicaPetQuerySchema),
  clinicaController.getCachedPet,
);

router.post(
  CLINICA_ROUTE_PATHS.fetchCaseVisits,
  requirePermission(Permission.READ_PATIENT),
  validateBody(ClinicaCaseVisitsBodySchema),
  clinicaController.fetchCaseVisits,
);

router.post(
  CLINICA_ROUTE_PATHS.fetchPetVisits,
  requirePermission(Permission.READ_PATIENT),
  validateParams(ClinicaClientParamsSchema),
  validateBody(ClinicaPetVisitsBodySchema),
  clinicaController.fetchPetVisits,
);

router.post(
  CLINICA_ROUTE_PATHS.syncClient,
  requirePermission(Permission.WRITE_PATIENT),
  validateParams(ClinicaExternalPatientParamsSchema),
  clinicaController.syncClient,
);

export default router;
