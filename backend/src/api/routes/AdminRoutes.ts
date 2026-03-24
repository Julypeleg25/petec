import PromiseRouter from "express-promise-router";
import AdminController from "../controllers/AdminController";
import {
  validateCreateAnimalVitals,
  validateCreateDosageFrequencyType,
  validateCreateMedicine,
  validateCreateRaceType,
  validateCreateSystemEntityType,
  validateEditAnimalVitals,
  validateEditDosageFrequencyType,
  validateEditMedicine,
  validateEditRaceType,
  validateEditSystemEntityType,
  validateEditUser,
  validateIdExist,
} from "../middlewares/Validations";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import { NextFunction, Response } from "express";
import uploadFileMiddleware from "../../config/multer";

const router = PromiseRouter();

export const ensureUserIsAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  req.user?.userRole === "ADMIN"
    ? next()
    : res.status(401).json({ error: "Unauthorized access!" });
};

router.get("/animalType/all", AdminController.getAllAnimalTypes);

router.post(
  "/animalType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newAnimalType
);

router.put(
  "/animalType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editAnimalType
);

router.delete(
  "/animalType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteAnimalType
);

router.get("/raceType/all", AdminController.getAllRaceTypes);

router.get(
  "/raceType/allByAnimalId/:id",
  AdminController.getRaceTypesByAnimalId
);

router.post(
  "/raceType/new",
  ensureUserIsAdmin,
  validateCreateRaceType,
  AdminController.newRaceType
);

router.put(
  "/raceType/edit",
  ensureUserIsAdmin,
  validateEditRaceType,
  AdminController.editRaceType
);

router.delete(
  "/raceType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteRaceType
);

router.get("/animalColor/all", AdminController.getAllAnimalColors);

router.post(
  "/animalColor/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newAnimalColor
);

router.put(
  "/animalColor/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editAnimalColor
);

router.delete(
  "/animalColor/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteAnimalColor
);

router.get(
  "/animalVitals/allByAnimalId/:animalId",
  AdminController.allByAnimalId
);

router.post(
  "/animalVitals/new",
  ensureUserIsAdmin,
  validateCreateAnimalVitals,
  AdminController.newAnimalVitals
);

router.put(
  "/animalVitals/edit",
  ensureUserIsAdmin,
  validateEditAnimalVitals,
  AdminController.editAnimalVitals
);

router.delete(
  "/animalVitals/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteAnimalVitals
);

router.get("/fecesType/all", AdminController.getAllFecesTypes);

router.post(
  "/fecesType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newFecesType
);

router.put(
  "/fecesType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editFecesType
);

router.delete(
  "/fecesType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteFecesType
);

router.get("/foodType/all", AdminController.getAllFoodTypes);

router.post(
  "/foodType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newFoodType
);

router.put(
  "/foodType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editFoodType
);

router.delete(
  "/foodType/delete",
  validateIdExist,
  ensureUserIsAdmin,
  AdminController.deleteFoodType
);

router.get("/genderType/all", AdminController.getAllGenderTypes);

router.post(
  "/genderType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newGenderType
);

router.put(
  "/genderType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editGenderType
);

router.delete(
  "/genderType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteGenderType
);

router.get("/urineType/all", AdminController.getAllUrineTypes);

router.post(
  "/urineType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newUrineType
);

router.put(
  "/urineType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editUrineType
);

router.delete(
  "/urineType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteUrineType
);

router.get("/measureUnitType/all", AdminController.getAllMeasureUnitTypes);

router.post(
  "/measureUnitType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newMeasureUnitType
);

router.put(
  "/measureUnitType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editMeasureUnitType
);

router.delete(
  "/measureUnitType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteMeasureUnitType
);

router.get(
  "/dosageFrequencyType/all",
  AdminController.getAllDosageFrequencyTypes
);

router.post(
  "/dosageFrequencyType/new",
  ensureUserIsAdmin,
  validateCreateDosageFrequencyType,
  AdminController.newDosageFrequencyType
);

router.put(
  "/dosageFrequencyType/edit",
  ensureUserIsAdmin,
  validateEditDosageFrequencyType,
  AdminController.editDosageFrequencyType
);

router.delete(
  "/dosageFrequencyType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteDosageFrequencyType
);

router.get("/insuranceType/all", AdminController.getAllInsuranceTypes);

router.post(
  "/insuranceType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newInsuranceType
);

router.put(
  "/insuranceType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editInsuranceType
);

router.delete(
  "/insuranceType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteInsuranceType
);

router.get("/foodExtrasType/all", AdminController.getAllFoodExtrasTypes);

router.post(
  "/foodExtrasType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newFoodExtrasType
);

router.put(
  "/foodExtrasType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editFoodExtrasType
);

router.delete(
  "/foodExtrasType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteFoodExtrasType
);

router.get("/proceduresTypes/all", AdminController.getAllProceduresTypes);

router.post(
  "/proceduresTypes/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newProcedureType
);

router.put(
  "/proceduresTypes/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editProcedureType
);

router.delete(
  "/proceduresTypes/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteProcedureType
);

router.get("/examinationType/all", AdminController.getAllExaminationTypes);

router.post(
  "/examinationType/new",
  ensureUserIsAdmin,
  validateCreateSystemEntityType,
  AdminController.newExaminationType
);

router.put(
  "/examinationType/edit",
  ensureUserIsAdmin,
  validateEditSystemEntityType,
  AdminController.editExaminationType
);

router.delete(
  "/examinationType/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteExaminationType
);

router.get(
  "/routeOfAdministration/all",
  AdminController.getMedicinesRoutesForAdministration
);

router.post(
  "/routeOfAdministration/new",
  ensureUserIsAdmin,
  AdminController.newRouteOfAdministration
);

router.put(
  "/routeOfAdministration/edit",
  ensureUserIsAdmin,
  AdminController.editRouteOfAdministration
);

router.delete(
  "/routeOfAdministration/delete",
  ensureUserIsAdmin,
  AdminController.deleteRouteOfAdministration
);

router.put(
  "/user/edit",
  ensureUserIsAdmin,
  validateEditUser,
  AdminController.editUser
);

router.delete(
  "/user/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteUser
);

router.post(
  "/medicine/new",
  ensureUserIsAdmin,
  validateCreateMedicine,
  AdminController.newMedicine
);

router.put(
  "/medicine/edit",
  ensureUserIsAdmin,
  validateEditMedicine,
  AdminController.editMedicine
);

router.delete(
  "/medicine/delete",
  ensureUserIsAdmin,
  validateIdExist,
  AdminController.deleteMedicine
);

router.post(
  "/downloadBulkTemplate",
  ensureUserIsAdmin,
  AdminController.downloadBulkTemplate
);

router.post(
  "/uploadBulkTemplate/:systemType",
  ensureUserIsAdmin,
  uploadFileMiddleware,
  AdminController.uploadBulkTemplate
);

export default router;
