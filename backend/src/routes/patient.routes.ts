import { Router } from "express";
import { patientController } from "@controllers/patient.controller";
import { authenticate, requirePermission } from "@middlewares/auth.middleware";
import { validateBody, validateParams } from "@middlewares/validate";
import { uploadDocument, uploadImage } from "@middlewares/upload";
import { Permission, UPLOAD } from "@petec/shared";
import {
    NewPatientDTOSchema,
    EditPatientDTOSchema,
    ReleasePatientDTOSchema,
    ArchivePatientDTOSchema,
    DeletePatientCaseDTOSchema,
    CreateAnesthesiaProcedureFormDTOSchema,
    UploadDocumentDTOSchema,
    UpdateDailyPlanRequestDTOSchema,
    CaseIdParamsDTOSchema,
    PatientIdParamsDTOSchema,
    DocumentIdParamsDTOSchema,
} from "@petec/shared";

const router = Router();

const PATIENT_ROUTE_PATHS = {
    PATIENT_PHOTO: "/photo/:patientId",
    NEW: "/new",
    EDIT: "/edit",
    CASE_DAILY_DETAILS: "/case/caseDailyDetails/:caseId",
    CASE_DAILY_DETAILS_WITH_MASTER: "/case/caseDailyDetails/:masterCaseId/:caseId",
    CASE_DETAILS: "/case/details/:caseId",
    CASE_DETAILS_WITH_MASTER: "/case/details/:masterCaseId/:caseId",
    CASE_RELEASE: "/case/release",
    CASE_RELEASE_BY_ID: "/case/release/:caseId",
    CASE_ARCHIVE: "/case/archive",
    CASE_DELETE: "/case/delete",
    DOCUMENTS_BY_PATIENT: "/documents/:patientId",
    DOCUMENT_UPLOAD: "/documents/upload",
    DOCUMENT_DELETE: "/documents/:documentId",
    CASE_ANESTHESIA: "/case/anesthesia/:caseId",
    CASE_EXPORT: "/case/export/:caseId",
    CASE_CHARTS: "/case/charts/:caseId",
    DAILY_PLAN: "/dailyPlan",
} as const;

router.get(
    PATIENT_ROUTE_PATHS.PATIENT_PHOTO,
    validateParams(PatientIdParamsDTOSchema),
    patientController.getPatientPhoto,
);

router.use(authenticate);

router.post(
    PATIENT_ROUTE_PATHS.NEW,
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(NewPatientDTOSchema),
    patientController.createPatientAndCase,
);

router.put(
    PATIENT_ROUTE_PATHS.EDIT,
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(EditPatientDTOSchema),
    patientController.editPatientAndCase,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_DAILY_DETAILS,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_DAILY_DETAILS_WITH_MASTER,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_DETAILS,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_DETAILS_WITH_MASTER,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.post(
    PATIENT_ROUTE_PATHS.CASE_RELEASE,
    requirePermission(Permission.WRITE_CASE),
    validateBody(ReleasePatientDTOSchema),
    patientController.releasePatient,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_RELEASE_BY_ID,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getReleasePatientData,
);

router.put(
    PATIENT_ROUTE_PATHS.CASE_ARCHIVE,
    requirePermission(Permission.WRITE_CASE),
    validateBody(ArchivePatientDTOSchema),
    patientController.archivePatientCase,
);

router.delete(
    PATIENT_ROUTE_PATHS.CASE_DELETE,
    requirePermission(Permission.WRITE_CASE),
    validateBody(DeletePatientCaseDTOSchema),
    patientController.deletePatientCase,
);

router.get(
    PATIENT_ROUTE_PATHS.DOCUMENTS_BY_PATIENT,
    requirePermission(Permission.READ_PATIENT),
    validateParams(PatientIdParamsDTOSchema),
    patientController.getDocuments,
);

router.post(
    PATIENT_ROUTE_PATHS.DOCUMENT_UPLOAD,
    requirePermission(Permission.MANAGE_DOCUMENTS),
    uploadDocument.single(UPLOAD.FILE_FORM_FIELD_NAME),
    validateBody(UploadDocumentDTOSchema),
    patientController.uploadDocument,
);

router.post(
    PATIENT_ROUTE_PATHS.PATIENT_PHOTO,
    requirePermission(Permission.WRITE_PATIENT),
    validateParams(PatientIdParamsDTOSchema),
    uploadImage.single(UPLOAD.FILE_FORM_FIELD_NAME),
    patientController.uploadPatientPhoto,
);

router.delete(
    PATIENT_ROUTE_PATHS.DOCUMENT_DELETE,
    requirePermission(Permission.MANAGE_DOCUMENTS),
    validateParams(DocumentIdParamsDTOSchema),
    patientController.deleteDocument,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_ANESTHESIA,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getAnesthesiaForm,
);

router.post(
    PATIENT_ROUTE_PATHS.CASE_ANESTHESIA,
    requirePermission(Permission.WRITE_CASE),
    validateParams(CaseIdParamsDTOSchema),
    validateBody(CreateAnesthesiaProcedureFormDTOSchema),
    patientController.upsertAnesthesiaForm,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_EXPORT,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.exportCase,
);

router.get(
    PATIENT_ROUTE_PATHS.CASE_CHARTS,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getChartsData,
);

router.get(
    PATIENT_ROUTE_PATHS.DAILY_PLAN,
    requirePermission(Permission.READ_CASE),
    patientController.getDailyPlan,
);

router.put(
    PATIENT_ROUTE_PATHS.DAILY_PLAN,
    requirePermission(Permission.WRITE_CASE),
    validateBody(UpdateDailyPlanRequestDTOSchema),
    patientController.updateDailyPlan,
);

export default router;
