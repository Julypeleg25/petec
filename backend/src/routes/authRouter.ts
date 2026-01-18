import AuthController from "@controllers/authController";
import { validateBody } from "@middlewares/reqBodyValidator";
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@shared/schemas/auth.schema";
import express from "express";

const authRouter = express.Router();

authRouter.post(
  "/register",
  validateBody(RegisterSchema),
  AuthController.register,
);
authRouter.post("/login", validateBody(LoginSchema), AuthController.login);
authRouter.post("/refresh", AuthController.refresh);
authRouter.get("/logout", AuthController.logout);

authRouter.post("/forgot-password", AuthController.forgotPassword);
authRouter.post(
  "/reset-password",
  validateBody(ResetPasswordSchema),
  AuthController.resetPassword,
);

export default authRouter;
