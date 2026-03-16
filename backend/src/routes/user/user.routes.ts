import { Router } from "express";
import { userController } from "@controllers/user";
import { authenticate } from "@middlewares/auth.middleware";
import { USER_ROUTE_PATHS } from "./userRoutes.constants";

const router = Router();

router.use(authenticate);

router.get(USER_ROUTE_PATHS.doctors, userController.getDoctors);
router.get(USER_ROUTE_PATHS.nurses, userController.getNurses);

export default router;
