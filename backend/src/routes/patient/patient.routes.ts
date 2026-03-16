import { Router } from "express";
import { patientController } from "@controllers/patient";
import { authenticate, requirePermission } from "@middlewares/auth.middleware";
import { validateBody, validateParams } from "@middlewares/validate";
import { uploadImage } from "@middlewares/upload";
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
import { PATIENT_ROUTE_PATHS } from "./patientRoutes.constants";

const router = Router();

router.get(
    PATIENT_ROUTE_PATHS.patientPhoto,
    validateParams(PatientIdParamsDTOSchema),
    patientController.getPatientPhoto,
);

router.use(authenticate);

router.post(
    PATIENT_ROUTE_PATHS.newPatient,
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(NewPatientDTOSchema),
    patientController.createPatientAndCase,
);

router.put(
    PATIENT_ROUTE_PATHS.editPatient,
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(EditPatientDTOSchema),
    patientController.editPatientAndCase,
);

router.get(
    PATIENT_ROUTE_PATHS.caseDailyDetails,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.caseDailyDetailsWithMaster,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.caseDetails,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.get(
    PATIENT_ROUTE_PATHS.caseDetailsWithMaster,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getCaseDetails,
);

router.post(
    PATIENT_ROUTE_PATHS.caseRelease,
    requirePermission(Permission.WRITE_CASE),
    validateBody(ReleasePatientDTOSchema),
    patientController.releasePatient,
);

router.get(
    PATIENT_ROUTE_PATHS.caseReleaseById,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getReleasePatientData,
);

router.put(
    PATIENT_ROUTE_PATHS.caseArchive,
    requirePermission(Permission.WRITE_CASE),
    validateBody(ArchivePatientDTOSchema),
    patientController.archivePatientCase,
);

router.delete(
    PATIENT_ROUTE_PATHS.caseDelete,
    requirePermission(Permission.WRITE_CASE),
    validateBody(DeletePatientCaseDTOSchema),
    patientController.deletePatientCase,
);

router.get(
    PATIENT_ROUTE_PATHS.documentsByCase,
    requirePermission(Permission.READ_PATIENT),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getDocuments,
);

router.post(
    PATIENT_ROUTE_PATHS.documentUpload,
    requirePermission(Permission.MANAGE_DOCUMENTS),
    uploadImage.single(UPLOAD.FILE_FORM_FIELD_NAME),
    validateBody(UploadDocumentDTOSchema),
    patientController.uploadDocument,
);

router.post(
    PATIENT_ROUTE_PATHS.patientPhoto,
    requirePermission(Permission.WRITE_PATIENT),
    validateParams(PatientIdParamsDTOSchema),
    uploadImage.single(UPLOAD.FILE_FORM_FIELD_NAME),
    patientController.uploadPatientPhoto,
);

router.delete(
    PATIENT_ROUTE_PATHS.documentDelete,
    requirePermission(Permission.MANAGE_DOCUMENTS),
    validateParams(DocumentIdParamsDTOSchema),
    patientController.deleteDocument,
);

router.get(
    PATIENT_ROUTE_PATHS.caseAnesthesia,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getAnesthesiaForm,
);

router.post(
    PATIENT_ROUTE_PATHS.caseAnesthesia,
    requirePermission(Permission.WRITE_CASE),
    validateParams(CaseIdParamsDTOSchema),
    validateBody(CreateAnesthesiaProcedureFormDTOSchema),
    patientController.upsertAnesthesiaForm,
);

router.get(
    PATIENT_ROUTE_PATHS.caseExport,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.exportCase,
);

router.get(
    PATIENT_ROUTE_PATHS.caseCharts,
    requirePermission(Permission.READ_CASE),
    validateParams(CaseIdParamsDTOSchema),
    patientController.getChartsData,
);

router.get(
    PATIENT_ROUTE_PATHS.dailyPlan,
    requirePermission(Permission.READ_CASE),
    patientController.getDailyPlan,
);

router.put(
    PATIENT_ROUTE_PATHS.dailyPlan,
    requirePermission(Permission.WRITE_CASE),
    validateBody(UpdateDailyPlanRequestDTOSchema),
    patientController.updateDailyPlan,
);

export default router;
