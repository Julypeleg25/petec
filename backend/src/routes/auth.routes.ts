import { Router } from "express";
import { authController } from "@controllers/auth.controller";
import { authenticate, requireAdmin } from "@middlewares/auth.middleware";
import { validateBody } from "@middlewares/validate";
import {
  RegisterDTOSchema,
  LoginDTOSchema,
  ForgotPasswordDTOSchema,
  ResetPasswordDTOSchema,
} from "@petec/shared";

const router = Router();

const AUTH_ROUTE_PATHS = {
  REGISTER: "/register",
  LOGIN: "/login",
  REFRESH: "/refresh",
  LOGOUT: "/logout",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password"
} as const;

router.post(AUTH_ROUTE_PATHS.REGISTER, authenticate, requireAdmin, validateBody(RegisterDTOSchema), authController.register);
router.post(AUTH_ROUTE_PATHS.LOGIN, validateBody(LoginDTOSchema), authController.login);
router.post(AUTH_ROUTE_PATHS.REFRESH, authController.refresh);
router.post(AUTH_ROUTE_PATHS.LOGOUT, authController.logout);
router.post(AUTH_ROUTE_PATHS.FORGOT_PASSWORD, validateBody(ForgotPasswordDTOSchema), authController.forgotPassword);
router.post(AUTH_ROUTE_PATHS.RESET_PASSWORD, validateBody(ResetPasswordDTOSchema), authController.resetPassword);

export default router;
