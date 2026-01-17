import bcrypt from "bcryptjs";
import { UserModel, IUser } from "../models/User";
import { ENV } from "@config/config";
import {
  clearAuthCookies,
  generateTokens,
  setRefreshCookie,
  verifyRefreshToken,
} from "@utils/authTokens";
import { EmailData, getEmailData, sendEmail } from "@utils/emailUtils";
import { UnauthorizedError } from "@utils/errors";
import { Request, Response } from "express";

class AuthService {
  async register(req: Request): Promise<IUser> {
    const { username, password, firstName, lastName, email, role } = req.body;

    if (await UserModel.findOne({ email }))
      throw new Error("Email already exists");
    if (await UserModel.findOne({ username }))
      throw new Error("Username already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      role,
    });

    await user.save();
    return user;
  }

  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password!))) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    return { user, accessToken };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) throw new UnauthorizedError("No refresh token");

    const payload = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken)
      throw new UnauthorizedError("Invalid refresh token");

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    return { user, accessToken };
  }

  async logout(res: Response, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await UserModel.findById(payload.userId);
        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      } catch {}
    }
    clearAuthCookies(res);
  }

  async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email });
    if (!user) return;

    const token = generateTokens(user).accessToken;

    const resetUrl = `${ENV.frontendUrl}/#/resetPassword/${token}`;
    const emailData = getEmailData(resetUrl, user.email);

    await sendEmail(emailData);
  }

  async resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    const payload = verifyRefreshToken(token);
    const user = await UserModel.findOne({ _id: payload.userId });
    if (!user) throw new UnauthorizedError("Invalid token");

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    const { accessToken } = generateTokens(user);
    return { user, accessToken };
  }
}

export default new AuthService();
