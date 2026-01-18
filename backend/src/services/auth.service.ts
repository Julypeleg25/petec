import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { UserModel } from "@models/User";
import { ENV } from "@config/config";
import {
  clearAuthCookies,
  generateTokens,
  setRefreshCookie,
  verifyRefreshToken,
} from "@utils/authTokens";
import { getEmailData, sendEmail } from "@utils/emailUtils";
import { UnauthorizedError } from "@utils/errors";
import { logger } from "@utils/logger/logger";
import { toUserDto } from "@mappers/user.mapper";
import { UserDto } from "@shared/dtos/user.dto";
import { UserRoleModel } from "@models/UserRole";

class AuthService {
  async register(req: Request): Promise<UserDto> {
    try {
      const { username, password, firstName, lastName, email, role } = req.body;

      if (await UserModel.findOne({ email }))
        throw new UnauthorizedError("Email already exists");
      if (await UserModel.findOne({ username }))
        throw new UnauthorizedError("Username already exists");

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

      logger.info(`User registered: ${user._id}`);
      const fullUser = await user.populate({
        path: "role",
        model: UserRoleModel,
      });

      return toUserDto(fullUser);
    } catch (err) {
      logger.error("Error in register", err);
      throw err;
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const user = await UserModel.findOne({ username }).select("+password");
      if (!user || !(await bcrypt.compare(password, user.password!))) {
        throw new UnauthorizedError("Invalid credentials");
      }

      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshToken = refreshToken;
      await user.save();

      const fullUser = await user.populate({
        path: "role",
        model: UserRoleModel,
      });

      setRefreshCookie(res, refreshToken);

      return { user: toUserDto(fullUser), accessToken };
    } catch (err) {
      logger.error("Error in login", err);
      throw err;
    }
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      if (!refreshToken) throw new UnauthorizedError("No refresh token");

      const payload = verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(payload.userId).populate("role");
      if (!user || user.refreshToken !== refreshToken)
        throw new UnauthorizedError("Invalid refresh token");

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);
      user.refreshToken = newRefreshToken;
      await user.save();

      const fullUser = await user.populate({
        path: "role",
        model: UserRoleModel,
      });
      setRefreshCookie(res, newRefreshToken);

      return { user: toUserDto(fullUser), accessToken };
    } catch (err) {
      logger.error("Error in refresh", err);
      throw err;
    }
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

        clearAuthCookies(res);
      } catch (err) {
        logger.error("Error in logout", err);
        throw err;
      }
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) return;

      const token = generateTokens(user).accessToken;
      const resetUrl = `${ENV.frontendUrl}/#/resetPassword/${token}`;
      const emailData = getEmailData(resetUrl, user.email);

      await sendEmail(emailData);
      logger.info(`Password reset email sent to ${email}`);
    } catch (err) {
      logger.error("Error in forgotPassword", err);
      throw err;
    }
  }

  async resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await UserModel.findOne({ _id: payload.userId });
      if (!user) throw new UnauthorizedError("Invalid token");

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();

      const fullUser = await user.populate({
        path: "role",
        model: UserRoleModel,
      });

      const { accessToken } = generateTokens(user);
      return { user: toUserDto(fullUser), accessToken };
    } catch (err) {
      logger.error("Error in resetPassword", err);
      throw err;
    }
  }
}

export default new AuthService();
