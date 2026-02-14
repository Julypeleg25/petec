import { Router } from "express";
import { tableController } from "@controllers/table.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { validateBody } from "@middlewares/validate";
import { GetTableDataDTOSchema } from "@petec/shared";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(GetTableDataDTOSchema), tableController.getTableData);

export default router;
