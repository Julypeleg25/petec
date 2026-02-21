import { Router } from "express";
import { medicineController } from "@controllers/medicine.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { validateParams } from "@middlewares/validate";
import { CategoryIdParamsDTOSchema } from "@petec/shared";

const router = Router();

router.use(authenticate);

router.get("/all", medicineController.getAll);
router.get("/getAllByCategoryType/:categoryId", validateParams(CategoryIdParamsDTOSchema), medicineController.getAllByCategoryType);
router.get("/getAllCategoryTypes", medicineController.getAllCategoryTypes);
router.get("/medicinesFrequencies", medicineController.getMedicinesFrequencies);
router.get("/medicinesRoutesForAdministration", medicineController.getMedicinesRoutesForAdministration);
router.get("/measureUnitTypes", medicineController.getMeasureUnitTypes);

export default router;
