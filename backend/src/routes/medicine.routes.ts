import { Router } from "express";
import { medicineController } from "@controllers/medicine.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { validateParams } from "@middlewares/validate";
import { CategoryIdParamsDTOSchema } from "@petec/shared";

const router = Router();

router.use(authenticate);

const MEDICINE_ROUTE_PATHS = {
    ALL: "/all",
    BY_CATEGORY: "/getAllByCategoryType/:categoryId",
    CATEGORY_TYPES: "/getAllCategoryTypes",
    FREQUENCIES: "/medicinesFrequencies",
    ROUTES_OF_ADMINISTRATION: "/medicinesRoutesForAdministration",
    MEASURE_UNITS: "/measureUnitTypes",
} as const;

router.get(MEDICINE_ROUTE_PATHS.ALL, medicineController.getAll);
router.get(MEDICINE_ROUTE_PATHS.BY_CATEGORY, validateParams(CategoryIdParamsDTOSchema), medicineController.getAllByCategoryType);
router.get(MEDICINE_ROUTE_PATHS.CATEGORY_TYPES, medicineController.getAllCategoryTypes);
router.get(MEDICINE_ROUTE_PATHS.FREQUENCIES, medicineController.getMedicinesFrequencies);
router.get(MEDICINE_ROUTE_PATHS.ROUTES_OF_ADMINISTRATION, medicineController.getMedicinesRoutesForAdministration);
router.get(MEDICINE_ROUTE_PATHS.MEASURE_UNITS, medicineController.getMeasureUnitTypes);

export default router;
