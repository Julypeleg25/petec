import { Router } from "express";
import { adminController } from "@controllers/admin.controller";
import { authenticate, requireAdmin } from "@middlewares/auth.middleware";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/types/:typeName", adminController.getActiveTypes);
router.get("/types/:typeName/all", adminController.getAllTypes);
router.post("/types/:typeName", adminController.createType);
router.put("/types/:typeName/:id", adminController.updateType);
router.delete("/types/:typeName/:id", adminController.deleteType);
router.get("/types/:typeName/animal/:animalTypeId", adminController.getTypesByAnimalType);

router.get("/users", adminController.getAllUsers);
router.put("/users/:userId", adminController.updateUser);
router.delete("/users/:userId", adminController.deleteUser);

export default router;
