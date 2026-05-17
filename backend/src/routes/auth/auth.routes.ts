import { Router } from "express";
import { authController } from "../../controllers/auth/index.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.js";
import {
  RegisterDTOSchema,
  LoginDTOSchema,
  ForgotPasswordDTOSchema,
  ResetPasswordDTOSchema,
} from "@petec/shared";
import { AUTH_ROUTE_PATHS } from "./authRoutes.constants.js";

const router = Router();

router.post(AUTH_ROUTE_PATHS.register, authenticate, requireAdmin, validateBody(RegisterDTOSchema), authController.register);
router.post(AUTH_ROUTE_PATHS.login, validateBody(LoginDTOSchema), authController.login);
router.post(AUTH_ROUTE_PATHS.refresh, authController.refresh);
router.post(AUTH_ROUTE_PATHS.logout, authController.logout);
router.post(AUTH_ROUTE_PATHS.forgotPassword, validateBody(ForgotPasswordDTOSchema), authController.forgotPassword);
router.post(AUTH_ROUTE_PATHS.resetPassword, validateBody(ResetPasswordDTOSchema), authController.resetPassword);

export default router;
