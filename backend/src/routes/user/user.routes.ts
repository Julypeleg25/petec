import { Router } from "express";
import { userController } from "../../controllers/user/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { USER_ROUTE_PATHS } from "./userRoutes.constants.js";

const router = Router();

router.use(authenticate);

router.get(USER_ROUTE_PATHS.doctors, userController.getDoctors);
router.get(USER_ROUTE_PATHS.nurses, userController.getNurses);

export default router;
