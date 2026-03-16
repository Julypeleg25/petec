import { Router } from "express";
import { medicineController } from "@controllers/medicine";
import { authenticate } from "@middlewares/auth.middleware";
import { validateParams } from "@middlewares/validate";
import { CategoryTypeParamsDTOSchema } from "@petec/shared";
import { MEDICINE_ROUTE_PATHS } from "./medicineRoutes.constants";

const router = Router();

router.use(authenticate);

router.get(MEDICINE_ROUTE_PATHS.all, medicineController.getAll);
router.get(MEDICINE_ROUTE_PATHS.byCategory, validateParams(CategoryTypeParamsDTOSchema), medicineController.getAllByCategoryType);
router.get(MEDICINE_ROUTE_PATHS.categoryTypes, medicineController.getAllCategoryTypes);
router.get(MEDICINE_ROUTE_PATHS.frequencies, medicineController.getMedicinesFrequencies);
router.get(MEDICINE_ROUTE_PATHS.routesOfAdministration, medicineController.getMedicinesRoutesForAdministration);
router.get(MEDICINE_ROUTE_PATHS.measureUnits, medicineController.getMeasureUnitTypes);

export default router;
