import { Router } from "express";
import { clinicaController } from "../controllers/clinica.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(authenticate);

router.post("/sync-all", (req, res) =>
  clinicaController.syncAll(req, res)
);

export default router;