import type { Request, Response, NextFunction } from "express";
import { authService } from "@services/auth.service";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getAuthenticatedUserId, getValidatedBody } from "@utils/request.utils";
import { AuthError } from "@utils/errors";
import { COOKIE_NAMES, ROLES } from "@petec/shared";
import type { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from "@petec/shared";
import {
  RegisterResponseDTOSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  ForgotPasswordMessageSchema,
  UserRolesResponseSchema,
} from "@petec/shared";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<RegisterDTO>(req);
      const result = await authService.register(
        body.username,
        body.email,
        body.password,
        body.role,
        body.privileges,
      );
      sendCreated(res, result, RegisterResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<LoginDTO>(req);
      const result = await authService.login(body.username, body.password, res);
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
      const userId = getAuthenticatedUserId(req);
      const token = req.cookies?.[COOKIE_NAMES.REFRESH];
      await authService.logout(userId, token, res);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<ForgotPasswordDTO>(req);
      await authService.forgotPassword(body.email);
      const payload = { message: "If the email exists, a reset link has been sent" };
      sendSuccess(res, payload, ForgotPasswordMessageSchema);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = getValidatedBody<ResetPasswordDTO>(req);
      await authService.resetPassword(body.token, body.password);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getUserRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      void req;
      sendSuccess(res, [...ROLES], UserRolesResponseSchema);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
