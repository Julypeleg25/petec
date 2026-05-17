import { Router } from "express";
import { tableController } from "../../controllers/table/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.js";
import { GetTableDataDTOSchema } from "@petec/shared";
import { TABLE_ROUTE_PATHS } from "./tableRoutes.constants.js";

const router = Router();

router.use(authenticate);

router.post(TABLE_ROUTE_PATHS.root, validateBody(GetTableDataDTOSchema), tableController.getTableData);

export default router;
