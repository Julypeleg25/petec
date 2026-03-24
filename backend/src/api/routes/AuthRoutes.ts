import { ensureUserIsAdmin } from "./AdminRoutes";
import AuthController from "../controllers/AuthController";
import {
  validateForgotPassword,
  validateRefreshTokenExist,
  validateResetPassword,
  validateUserLogin,
  validateUserRegistration,
} from "../middlewares/Validations";
import PromiseRouter from "express-promise-router";
import authMiddleware from "../middlewares/AuthMiddleware";
import validateResetPasswordJwt from "../middlewares/validate-reset-password-jwt";

const router = PromiseRouter();

router.post(
  "/register",
  validateUserRegistration,
  authMiddleware,
  ensureUserIsAdmin,
  AuthController.register
);

router.post("/login", validateUserLogin, AuthController.login);

router.post("/logout", validateRefreshTokenExist, AuthController.logout);

router.post(
  "/refreshToken",
  validateRefreshTokenExist,
  AuthController.refreshToken
);

router.get(
  "/userRoles",
  authMiddleware,
  ensureUserIsAdmin,
  AuthController.getUserRoles
);

router.post(
  "/forgotPassword",
  validateForgotPassword,
  AuthController.forgotPassword
);

router.patch(
  "/resetPassword",
  validateResetPassword,
  validateResetPasswordJwt,
  AuthController.resetPassword
);

export default router;
