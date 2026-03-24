import PromiseRouter from "express-promise-router";
import {
  ensureAnimalDetailsExist,
  validateArchivePatient,
  validateCreateAnesthesiaProcedureForm,
  validateCreatePatient,
  validateDeleteDocument,
  validateDeletePatient,
  validateEditAnesthesiaProcedureForm,
  validateEditPatient,
  validateReleasePatient,
  validateUpdateDailyPlan,
  validateUploadDocument,
} from "../middlewares/Validations";
import PatientController from "../controllers/PatientController";
import authMiddleware from "../middlewares/AuthMiddleware";
import uploadFileMiddleware from "../../config/multer";
import AdminController from "../controllers/AdminController";

const router = PromiseRouter();
const patientController = new PatientController();

router.post(
  "/new",
  authMiddleware,
  uploadFileMiddleware,
  validateCreatePatient,
  ensureAnimalDetailsExist,
  patientController.create
);

router.post(
  "/edit",
  authMiddleware,
  uploadFileMiddleware,
  validateEditPatient,
  ensureAnimalDetailsExist,
  patientController.edit
);

router.get(
  "/case/details/:masterCaseId/:caseId",
  authMiddleware,
  patientController.getCaseDetails
);

router.get(
  "/case/caseDailyDetails/:id",
  authMiddleware,
  patientController.getCaseDailyDetails
);

router.get(
  "/case/anesthesiaProcedureForm/:id",
  authMiddleware,
  patientController.getAnesthesiaProcedureForm
);

router.post(
  "/case/anesthesiaProcedureForm/new",
  authMiddleware,
  validateCreateAnesthesiaProcedureForm,
  patientController.anesthesiaProcedureFormNew
);

router.put(
  "/case/anesthesiaProcedureForm/edit",
  authMiddleware,
  validateEditAnesthesiaProcedureForm,
  patientController.anesthesiaProcedureFormEdit
);

router.get(
  "/case/foodExtrasTypes",
  authMiddleware,
  AdminController.getAllFoodExtrasTypes
);

router.get(
  "/case/proceduresTypes",
  authMiddleware,
  AdminController.getAllProceduresTypes
);

router.get(
  "/case/examinations",
  authMiddleware,
  AdminController.getAllExaminationTypes
);

router.post(
  "/release",
  authMiddleware,
  validateReleasePatient,
  patientController.releasePatient
);

router.delete(
  "/delete",
  authMiddleware,
  validateDeletePatient,
  patientController.deletePatientCase
);

router.get(
  "/releasePatientData/:id",
  authMiddleware,
  patientController.getReleasePatientData
);

router.post(
  "/exportPatientCase/:id",
  authMiddleware,
  patientController.exportPatientCase
);

router.post(
  "/documents",
  authMiddleware,
  uploadFileMiddleware,
  validateUploadDocument,
  patientController.uploadDocuments
);

router.get(
  "/documents/:caseId",
  authMiddleware,
  patientController.getDocuments
);

router.delete(
  "/documents",
  authMiddleware,
  validateDeleteDocument,
  patientController.deleteDocument
);

router.get(
  "/chartsData/:caseId",
  authMiddleware,
  patientController.getChartsData
);

router.put(
  "/archivePatient",
  authMiddleware,
  validateArchivePatient,
  patientController.archivePatient
);

router.get("/dailyPlan", authMiddleware, patientController.getDailyPlan);

router.put(
  "/dailyPlan/edit",
  authMiddleware,
  validateUpdateDailyPlan,
  patientController.updateDailyPlan
);

export default router;
