import { Router } from "express";
import { tableController } from "@controllers/table";
import { authenticate } from "@middlewares/auth.middleware";
import { validateBody } from "@middlewares/validate";
import { GetTableDataDTOSchema } from "@petec/shared";
import { TABLE_ROUTE_PATHS } from "./tableRoutes.constants";

const router = Router();

router.use(authenticate);

router.post(TABLE_ROUTE_PATHS.root, validateBody(GetTableDataDTOSchema), tableController.getTableData);

export default router;
