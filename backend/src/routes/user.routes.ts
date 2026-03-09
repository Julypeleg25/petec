import { Router } from "express";
import { userController } from "@controllers/user.controller";
import { authenticate } from "@middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

const USER_ROUTE_PATHS = {
    DOCTORS: "/doctors",
    NURSES: "/nurses",
} as const;

router.get(USER_ROUTE_PATHS.DOCTORS, userController.getDoctors);
router.get(USER_ROUTE_PATHS.NURSES, userController.getNurses);

export default router;
