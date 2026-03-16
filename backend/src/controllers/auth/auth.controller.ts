import type { Request, Response, NextFunction } from "express";
import { authService } from "@services/auth";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getValidatedBody } from "@utils/request.utils";
import { AuthError } from "@constants/error.constants";
import {
  RegisterResponseDTOSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  ForgotPasswordMessageSchema,
  COOKIE_NAMES,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from "@petec/shared";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<RegisterDTO>(req);
      const result = await authService.register(body);
      sendCreated(res, result, RegisterResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<LoginDTO>(req);
      const result = await authService.login(body, res);
      sendSuccess(res, result, LoginResponseSchema);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[COOKIE_NAMES.REFRESH];
      if (typeof token !== "string" || token.length === 0) {
        throw new AuthError("No refresh token");
      }
      const result = await authService.refresh(token, res);
      sendSuccess(res, result, RefreshResponseSchema);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[COOKIE_NAMES.REFRESH];
      const userId =
        typeof req.authenticatedUser?.userId === "string"
          ? req.authenticatedUser.userId
          : undefined;
      await authService.logout(userId, token, res);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<ForgotPasswordDTO>(req);
      await authService.forgotPassword(body);
      const payload = { message: "If the email exists, a reset link has been sent" };
      sendSuccess(res, payload, ForgotPasswordMessageSchema);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<ResetPasswordDTO>(req);
      await authService.resetPassword(body);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
