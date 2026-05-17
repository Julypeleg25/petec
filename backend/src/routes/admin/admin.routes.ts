import { Router } from "express";
import { adminController, bulkTemplateController } from "../../controllers/admin/index.js";
import {
  authenticate,
  requireAdmin,
  requirePermission,
} from "../../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validate.js";
import { validateAdminCreateTypeBody, validateAdminUpdateTypeBody } from "../../middlewares/adminTypeBodyValidation.js";
import { uploadBulkTemplate } from "../../middlewares/upload.js";
import { Permission, UPLOAD } from "@petec/shared";
import {
  SystemTypeNameParamsDTOSchema,
  SystemTypeNameWithIdParamsDTOSchema,
  SystemTypeByAnimalParamsDTOSchema,
  UserIdParamsDTOSchema,
  UpdateUserDTOSchema,
  BulkTemplateDownloadDTOSchema,
  BulkTemplateUploadParamsDTOSchema,
} from "@petec/shared";
import { ADMIN_ROUTE_PATHS } from "./adminRoutes.constants.js";

const router = Router();

router.use(authenticate);

router.post(
  ADMIN_ROUTE_PATHS.bulkDownload,
  requireAdmin,
  validateBody(BulkTemplateDownloadDTOSchema),
  bulkTemplateController.downloadTemplate,
);
router.post(
  ADMIN_ROUTE_PATHS.bulkUpload,
  requireAdmin,
  validateParams(BulkTemplateUploadParamsDTOSchema),
  uploadBulkTemplate.single(UPLOAD.FILE_FORM_FIELD_NAME),
  bulkTemplateController.uploadTemplate,
);

router.get(
  ADMIN_ROUTE_PATHS.activeTypes,
  requirePermission(Permission.READ_PATIENT),
  validateParams(SystemTypeNameParamsDTOSchema),
  adminController.getActiveTypes,
);
router.get(ADMIN_ROUTE_PATHS.allTypes, requireAdmin, validateParams(SystemTypeNameParamsDTOSchema), adminController.getAllTypes);
router.post(ADMIN_ROUTE_PATHS.activeTypes, requireAdmin, validateParams(SystemTypeNameParamsDTOSchema), validateAdminCreateTypeBody, adminController.createType);
router.put(ADMIN_ROUTE_PATHS.typeById, requireAdmin, validateParams(SystemTypeNameWithIdParamsDTOSchema), validateAdminUpdateTypeBody, adminController.updateType);
router.delete(ADMIN_ROUTE_PATHS.typeById, requireAdmin, validateParams(SystemTypeNameWithIdParamsDTOSchema), adminController.deleteType);
router.get(
  ADMIN_ROUTE_PATHS.typesByAnimal,
  requirePermission(Permission.READ_PATIENT),
  validateParams(SystemTypeByAnimalParamsDTOSchema),
  adminController.getTypesByAnimalType,
);

router.get(ADMIN_ROUTE_PATHS.users, requireAdmin, adminController.getAllUsers);
router.put(ADMIN_ROUTE_PATHS.userById, requireAdmin, validateParams(UserIdParamsDTOSchema), validateBody(UpdateUserDTOSchema), adminController.updateUser);
router.delete(ADMIN_ROUTE_PATHS.userById, requireAdmin, validateParams(UserIdParamsDTOSchema), adminController.deleteUser);

export default router;
