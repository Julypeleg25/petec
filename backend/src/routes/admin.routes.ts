import { Router } from "express";
import { adminController } from "@controllers/admin.controller";
import { bulkTemplateController } from "@controllers/bulkTemplate.controller";
import {
  authenticate,
  requireAdmin,
  requirePermission,
} from "@middlewares/auth.middleware";
import { validateBody, validateParams } from "@middlewares/validate";
import { validateAdminCreateTypeBody, validateAdminUpdateTypeBody } from "@middlewares/adminTypeBodyValidation";
import { uploadBulkTemplate } from "@middlewares/upload";
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

const router = Router();

router.use(authenticate);

const ADMIN_ROUTE_PATHS = {
  ACTIVE_TYPES: "/types/:typeName",
  ALL_TYPES: "/types/:typeName/all",
  TYPE_BY_ID: "/types/:typeName/:id",
  TYPES_BY_ANIMAL: "/types/:typeName/animal/:animalTypeId",
  BULK_DOWNLOAD: "/types/bulk/download",
  BULK_UPLOAD: "/types/bulk/upload/:systemType",
  USERS: "/users",
  USER_BY_ID: "/users/:userId",
} as const;

router.post(
  ADMIN_ROUTE_PATHS.BULK_DOWNLOAD,
  requireAdmin,
  validateBody(BulkTemplateDownloadDTOSchema),
  bulkTemplateController.downloadTemplate,
);
router.post(
  ADMIN_ROUTE_PATHS.BULK_UPLOAD,
  requireAdmin,
  validateParams(BulkTemplateUploadParamsDTOSchema),
  uploadBulkTemplate.single(UPLOAD.FILE_FORM_FIELD_NAME),
  bulkTemplateController.uploadTemplate,
);

router.get(
  ADMIN_ROUTE_PATHS.ACTIVE_TYPES,
  requirePermission(Permission.READ_PATIENT),
  validateParams(SystemTypeNameParamsDTOSchema),
  adminController.getActiveTypes,
);
router.get(ADMIN_ROUTE_PATHS.ALL_TYPES, requireAdmin, validateParams(SystemTypeNameParamsDTOSchema), adminController.getAllTypes);
router.post(ADMIN_ROUTE_PATHS.ACTIVE_TYPES, requireAdmin, validateParams(SystemTypeNameParamsDTOSchema), validateAdminCreateTypeBody, adminController.createType);
router.put(ADMIN_ROUTE_PATHS.TYPE_BY_ID, requireAdmin, validateParams(SystemTypeNameWithIdParamsDTOSchema), validateAdminUpdateTypeBody, adminController.updateType);
router.delete(ADMIN_ROUTE_PATHS.TYPE_BY_ID, requireAdmin, validateParams(SystemTypeNameWithIdParamsDTOSchema), adminController.deleteType);
router.get(
  ADMIN_ROUTE_PATHS.TYPES_BY_ANIMAL,
  requirePermission(Permission.READ_PATIENT),
  validateParams(SystemTypeByAnimalParamsDTOSchema),
  adminController.getTypesByAnimalType,
);

router.get(ADMIN_ROUTE_PATHS.USERS, requireAdmin, adminController.getAllUsers);
router.put(ADMIN_ROUTE_PATHS.USER_BY_ID, requireAdmin, validateParams(UserIdParamsDTOSchema), validateBody(UpdateUserDTOSchema), adminController.updateUser);
router.delete(ADMIN_ROUTE_PATHS.USER_BY_ID, requireAdmin, validateParams(UserIdParamsDTOSchema), adminController.deleteUser);

export default router;
