import AdminController from "../controllers/AdminController";
import PromiseRouter from "express-promise-router";

const router = PromiseRouter();

router.get("/all", AdminController.getAllMedicines);

router.get(
  "/getAllByCategoryType/:id",
  AdminController.getAllByMedicinesCategoryType
);

router.get("/medicinesFrequencies", AdminController.getAllDosageFrequencyTypes);

router.get(
  "/medicinesRoutesForAdministration",
  AdminController.getMedicinesRoutesForAdministration
);

router.get("/getAllCategoryTypes", AdminController.getAllMedicineCategoryTypes);

router.get("/measureUnitTypes", AdminController.getAllMeasureUnitTypes);

export default router;
