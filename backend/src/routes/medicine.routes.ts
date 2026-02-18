import { Router } from "express";
import { medicineController } from "@controllers/medicine.controller";
import { authenticate } from "@middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/all", medicineController.getAll);
router.get("/getAllByCategoryType/:categoryId", medicineController.getAllByCategoryType);
router.get("/getAllCategoryTypes", medicineController.getAllCategoryTypes);
router.get("/medicinesFrequencies", medicineController.getMedicinesFrequencies);
router.get("/medicinesRoutesForAdministration", medicineController.getMedicinesRoutesForAdministration);
router.get("/measureUnitTypes", medicineController.getMeasureUnitTypes);

export default router;
