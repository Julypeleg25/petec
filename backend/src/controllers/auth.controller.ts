import { Request, Response, NextFunction } from "express";
import { authService } from "@services/auth.service";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { COOKIE_NAMES } from "@petec/shared";
import type { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from "@petec/shared";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role, privileges } = req.body as RegisterDTO;
      const result = await authService.register(email, password, role, privileges);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  };

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginDTO;
      const result = await authService.login(email, password, res);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[COOKIE_NAMES.REFRESH] as string | undefined;
      if (!token) {
        res.status(401).json({ success: false, message: "No refresh token" });
        return;
      }
      const result = await authService.refresh(token, res);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user: { userId: string } }).user.userId;
      const token = req.cookies?.[COOKIE_NAMES.REFRESH] as string | undefined;
      await authService.logout(userId, token, res);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ForgotPasswordDTO;
      await authService.forgotPassword(email);
      sendSuccess(res, { message: "If the email exists, a reset link has been sent" });
    } catch (err) {
      next(err);
    }
  };

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as ResetPasswordDTO;
      await authService.resetPassword(token, password);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
