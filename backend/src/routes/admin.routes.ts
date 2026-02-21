import { Router } from "express";
import { adminController } from "@controllers/admin.controller";
import { authenticate, requireAdmin } from "@middlewares/auth.middleware";
import { validateBody, validateParams } from "@middlewares/validate";
import { validateAdminCreateTypeBody, validateAdminUpdateTypeBody } from "@middlewares/adminTypeBodyValidation";
import {
  SystemTypeNameParamsDTOSchema,
  SystemTypeNameWithIdParamsDTOSchema,
  SystemTypeByAnimalParamsDTOSchema,
  UserIdParamsDTOSchema,
  UpdateUserDTOSchema,
} from "@petec/shared";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/types/:typeName", validateParams(SystemTypeNameParamsDTOSchema), adminController.getActiveTypes);
router.get("/types/:typeName/all", validateParams(SystemTypeNameParamsDTOSchema), adminController.getAllTypes);
router.post("/types/:typeName", validateParams(SystemTypeNameParamsDTOSchema), validateAdminCreateTypeBody, adminController.createType);
router.put("/types/:typeName/:id", validateParams(SystemTypeNameWithIdParamsDTOSchema), validateAdminUpdateTypeBody, adminController.updateType);
router.delete("/types/:typeName/:id", validateParams(SystemTypeNameWithIdParamsDTOSchema), adminController.deleteType);
router.get("/types/:typeName/animal/:animalTypeId", validateParams(SystemTypeByAnimalParamsDTOSchema), adminController.getTypesByAnimalType);

router.get("/users", adminController.getAllUsers);
router.put("/users/:userId", validateParams(UserIdParamsDTOSchema), validateBody(UpdateUserDTOSchema), adminController.updateUser);
router.delete("/users/:userId", validateParams(UserIdParamsDTOSchema), adminController.deleteUser);

export default router;
