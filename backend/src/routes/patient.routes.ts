import { Router } from "express";
import { patientController } from "@controllers/patient.controller";
import { authenticate, requirePermission } from "@middlewares/auth.middleware";
import { validateBody } from "@middlewares/validate";
import { upload } from "@middlewares/upload";
import { Permission } from "@petec/shared";
import {
    NewPatientDTOSchema,
    EditPatientDTOSchema,
    ReleasePatientDTOSchema,
    ArchivePatientDTOSchema,
    DeletePatientCaseDTOSchema,
} from "@petec/shared";

const router = Router();

router.use(authenticate);

router.post(
    "/new",
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(NewPatientDTOSchema),
    patientController.createPatientAndCase,
);

router.put(
    "/edit",
    requirePermission(Permission.WRITE_PATIENT),
    validateBody(EditPatientDTOSchema),
    patientController.editPatientAndCase,
);

router.get(
    "/case/details/:caseId",
    requirePermission(Permission.READ_CASE),
    patientController.getCaseDetails,
);

router.post(
    "/case/release",
    requirePermission(Permission.WRITE_CASE),
    validateBody(ReleasePatientDTOSchema),
    patientController.releasePatient,
);

router.get(
    "/case/release/:caseId",
    requirePermission(Permission.READ_CASE),
    patientController.getReleasePatientData,
);

router.put(
    "/case/archive",
    requirePermission(Permission.WRITE_CASE),
    validateBody(ArchivePatientDTOSchema),
    patientController.archivePatientCase,
);

router.delete(
    "/case/delete",
    requirePermission(Permission.WRITE_CASE),
    validateBody(DeletePatientCaseDTOSchema),
    patientController.deletePatientCase,
);

router.get(
    "/documents/:patientId",
    requirePermission(Permission.READ_PATIENT),
    patientController.getDocuments,
);

router.post(
    "/documents/upload",
    requirePermission(Permission.MANAGE_DOCUMENTS),
    upload.single("file"),
    patientController.uploadDocument,
);

router.delete(
    "/documents/:id",
    requirePermission(Permission.MANAGE_DOCUMENTS),
    patientController.deleteDocument,
);

router.get(
    "/case/anesthesia/:caseId",
    requirePermission(Permission.READ_CASE),
    patientController.getAnesthesiaForm,
);

router.post(
    "/case/anesthesia/:caseId",
    requirePermission(Permission.WRITE_CASE),
    patientController.upsertAnesthesiaForm,
);

router.get(
    "/case/charts/:caseId",
    requirePermission(Permission.READ_CASE),
    patientController.getChartsData,
);

router.get(
    "/case/export/:caseId",
    requirePermission(Permission.READ_CASE),
    patientController.exportCase,
);

export default router;
