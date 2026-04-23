import { Router } from "express";
import { clinicaController } from "../controllers/clinica.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/query-import", clinicaController.queryImport);
router.post("/sync-all", clinicaController.syncAll);

export default router;