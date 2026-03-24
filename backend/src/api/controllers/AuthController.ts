import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import AuthService from "../services/AuthService";
import logger from "../../api/utils/Logger";

class AuthController {
  async register(req: AuthRequest, res: Response) {
    const { username, password, firstName, lastName, email, roleId } = req.body;

    try {
      const newUser = await AuthService.register(
        username,
        password,
        firstName,
        lastName,
        email,
        roleId
      );

      res.status(201).json(newUser);
    } catch (err: any) {
      logger.error("Failed to register new user: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    try {
      const tokens = await AuthService.login(username, password);

      res.status(200).json(tokens);
    } catch (err: any) {
      logger.error("Failed to login user: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (refreshToken == null) res.sendStatus(401);

    await AuthService.logout(refreshToken, res);
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (refreshToken == null) res.sendStatus(401);

    await AuthService.refreshToken(refreshToken, res);
  }

  async getUserRoles(req: Request, res: Response) {
    const roles = await AuthService.getUserRoles();
    res.status(200).json(roles);
  }

  async forgotPassword({ body: { email } }: Request, res: Response) {
    const dbUser = await AuthService.findByEmail(email);
    if (dbUser == null) {
      logger.error("Failed to find user by email: " + email);
      return res.sendStatus(200);
    }

    try {
      await AuthService.sendResetPasswordEmail(dbUser.email, dbUser.username);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  resetPassword = async (req: Request, res: Response) => {
    const {
      body: { newPassword, userName },
    } = req;

    await AuthService.resetPassword(newPassword, userName);
    req.body = { password: newPassword, username: userName };
    await this.login(req, res);
  };
}

export default new AuthController();
