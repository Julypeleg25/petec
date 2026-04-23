import { Router } from "express";
import { clinicaController } from "@controllers/clinica.controller";
import { authenticate } from "@middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/query-import",
  clinicaController.queryImport,
);

export default router;