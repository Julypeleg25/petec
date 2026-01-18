import { Request, Response, NextFunction } from "express";
import { COOKIE } from "@config/constants";
import { HttpStatusCode } from "axios";
import AuthService from "@services/auth.service";

class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.register(req);
      res.status(HttpStatusCode.Created).json(user);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {      
      const result = await AuthService.login(req, res);
      res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies[COOKIE.REFRESH];
      const result = await AuthService.refresh(refreshToken, res);
      res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies[COOKIE.REFRESH];
      await AuthService.logout(res, refreshToken);
      res.status(HttpStatusCode.Ok).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.forgotPassword(req.body.email);
      res.sendStatus(HttpStatusCode.Ok);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
