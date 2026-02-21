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

router.post("/register", validateBody(RegisterDTOSchema), authController.register);
router.post("/login", validateBody(LoginDTOSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.post("/forgot-password", validateBody(ForgotPasswordDTOSchema), authController.forgotPassword);
router.post("/reset-password", validateBody(ResetPasswordDTOSchema), authController.resetPassword);
router.get("/userRoles", authenticate, requireAdmin, authController.getUserRoles);

export default router;
