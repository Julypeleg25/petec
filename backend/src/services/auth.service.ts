import bcrypt from "bcryptjs";
import { userRepository } from "@repositories/user.repository";
import { auditRepository } from "@repositories/audit.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetPasswordToken,
  verifyResetPasswordToken,
  setRefreshCookie,
  clearRefreshCookie,
} from "@utils/authTokens";
import { sendEmail } from "@utils/emailUtils";
import { logger } from "@utils/logger";
import { AuthError, ConflictError, NotFoundError, BadRequestError } from "@utils/errors";
import { BCRYPT_SALT_ROUNDS, TOKEN_EXPIRY, Role } from "@petec/shared";
import type { Response } from "express";
import type { IRefreshToken, UserDocument } from "@models/User";
import type { LoginResponseDTO, RefreshResponseDTO, RegisterResponseDTO } from "@petec/shared";

const ENTITY_TYPE_USER = "User";
const AUDIT_SUBJECT_AUTH = "Authentication";

export class AuthService {
  async register(email: string, password: string, role: Role, privileges?: string[]): Promise<RegisterResponseDTO> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      privileges: privileges ?? [],
    });

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      `User registered: ${email}`,
      ENTITY_TYPE_USER,
      user._id.toString(),
    );

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  };

  async login(email: string, password: string, res: Response): Promise<LoginResponseDTO> {
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new AuthError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new AuthError("Account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password");
    }

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      privileges: user.privileges,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    const refreshTokenDoc: IRefreshToken = {
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_MS),
      createdAt: new Date(),
    };

    await userRepository.addRefreshToken(user._id, refreshTokenDoc);
    await userRepository.updateLastLogin(user._id);

    setRefreshCookie(res, refreshToken);

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      `User logged in: ${email}`,
      ENTITY_TYPE_USER,
      user._id.toString(),
      user._id,
    );

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        privileges: user.privileges,
        lastLogin: new Date().toISOString(),
      },
    };
  };

  async refresh(refreshTokenFromCookie: string, res: Response): Promise<RefreshResponseDTO> {
    let decoded: { userId: string; role: string; privileges: string[] };
    try {
      decoded = verifyRefreshToken(refreshTokenFromCookie);
    } catch {
      throw new AuthError("Invalid or expired refresh token");
    }

    const user = await userRepository.findByIdWithRefreshTokens(decoded.userId);
    if (!user) {
      throw new AuthError("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw new AuthError("Account is inactive");
    }

    const validToken = await this.findMatchingRefreshToken(user, refreshTokenFromCookie);
    if (!validToken) {
      await userRepository.removeAllRefreshTokens(user._id);
      logger.warn("Refresh token reuse detected, clearing all tokens", { userId: decoded.userId });
      throw new AuthError("Refresh token reuse detected");
    }

    await userRepository.removeRefreshToken(user._id, validToken.tokenHash);

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      privileges: user.privileges,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_SALT_ROUNDS);
    const newRefreshTokenDoc: IRefreshToken = {
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_MS),
      createdAt: new Date(),
    };

    await userRepository.addRefreshToken(user._id, newRefreshTokenDoc);
    setRefreshCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  };

  async logout(userId: string, refreshTokenFromCookie: string | undefined, res: Response): Promise<void> {
    if (refreshTokenFromCookie) {
      const user = await userRepository.findByIdWithRefreshTokens(userId);
      if (user) {
        const matchingToken = await this.findMatchingRefreshToken(user, refreshTokenFromCookie);
        if (matchingToken) {
          await userRepository.removeRefreshToken(userId, matchingToken.tokenHash);
        }
      }
    }

    clearRefreshCookie(res);

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      "User logged out",
      ENTITY_TYPE_USER,
      userId,
      userId,
    );
  };

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = generateResetPasswordToken(user._id.toString());

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Use this token to reset your password: <strong>${resetToken}</strong></p>`,
    });

    logger.info("Password reset email sent", { userId: user._id.toString() });
  };

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { userId: string };
    try {
      payload = verifyResetPasswordToken(token);
    } catch {
      throw new BadRequestError("Invalid or expired reset token");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await userRepository.updateById(user._id, { $set: { passwordHash } });
    await userRepository.removeAllRefreshTokens(user._id);

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      "Password reset completed",
      ENTITY_TYPE_USER,
      user._id.toString(),
      user._id,
    );
  };

  private async findMatchingRefreshToken(
    user: UserDocument,
    rawToken: string,
  ): Promise<IRefreshToken | undefined> {
    if (!user.refreshTokens || user.refreshTokens.length === 0) {
      return undefined;
    }

    for (const storedToken of user.refreshTokens) {
      if (storedToken.expiresAt < new Date()) {
        continue;
      }
      const isMatch = await bcrypt.compare(rawToken, storedToken.tokenHash);
      if (isMatch) {
        return storedToken;
      }
    }

    return undefined;
  };
}

export const authService = new AuthService();
