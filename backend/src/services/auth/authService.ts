import bcrypt from "bcryptjs";
import { userRepository } from "@repositories/user";
import { auditRepository } from "@repositories/audit";
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
import { logger } from "@config/logger";
import { ENV } from "@config/config";
import { AuthError, ConflictError, NotFoundError, BadRequestError } from "@constants/error.constants";
import { BCRYPT_SALT_ROUNDS, TOKEN_EXPIRY } from "@petec/shared";
import type { Response } from "express";
import type { IRefreshToken, UserDocument } from "@models/user";
import type { LoginDTO, LoginResponseDTO, ForgotPasswordDTO, ResetPasswordDTO, RefreshResponseDTO, RegisterDTO, RegisterResponseDTO, TokenPayload, ResetPasswordTokenPayload } from "@petec/shared";
import {
  buildAuthTokenPayload,
  buildUserFullName,
  findMatchingRefreshToken,
  isActiveUser,
} from "@services/auth/utils/authService.utils";
import { buildResetPasswordPath } from "@petec/shared";

const MODULE = "auth";
const AUDIT_SUBJECT_AUTH = "Authentication";
const ENTITY_TYPE_USER = "User";

export class AuthService {
  async register(dto: RegisterDTO): Promise<RegisterResponseDTO> {
    const existingEmail = await userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError("A user with this email already exists");
    }

    const existingUsername = await userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictError("A user with this username already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await userRepository.create({
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
      privileges: dto.privileges ?? [],
    });

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      `User registered: ${dto.username} (${dto.email})`,
      ENTITY_TYPE_USER,
      user._id.toString(),
    );

    return {
      id: user._id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
  }

  async login(dto: LoginDTO, res: Response): Promise<LoginResponseDTO> {
    const user = await userRepository.findByUsernameWithPassword(dto.username);

    if (!user) {
      throw new AuthError("Invalid username or password");
    }

    if (!isActiveUser(user)) {
      throw new AuthError("Account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Invalid username or password");
    }

    const tokenPayload = buildAuthTokenPayload(user);

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    const refreshTokenDoc: IRefreshToken = {
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + ENV.refreshTokenExpiresInMs),
      createdAt: new Date(),
    };

    await userRepository.addRefreshToken(user._id, refreshTokenDoc);
    await userRepository.updateLastLogin(user._id);

    setRefreshCookie(res, refreshToken);

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      `User logged in: ${dto.username}`,
      ENTITY_TYPE_USER,
      user._id.toString(),
      user._id,
    );

    logger.info("Login success", { module: MODULE, user_id: user._id.toString() });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        fullName: buildUserFullName(user),
        email: user.email,
        role: user.role,
        privileges: user.privileges,
        lastLogin: new Date().toISOString(),
      },
    };
  }

  async refresh(refreshTokenFromCookie: string, res: Response): Promise<RefreshResponseDTO> {
    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshTokenFromCookie);
    } catch {
      clearRefreshCookie(res);
      throw new AuthError("Invalid or expired refresh token");
    }

    const user = await userRepository.findByIdWithRefreshTokens(decoded.userId);
    if (!user) {
      clearRefreshCookie(res);
      throw new AuthError("User not found");
    }

    if (!isActiveUser(user)) {
      clearRefreshCookie(res);
      throw new AuthError("Account is inactive");
    }

    const validToken = await findMatchingRefreshToken(
      user,
      refreshTokenFromCookie,
    );
    if (!validToken) {
      await userRepository.removeAllRefreshTokens(user._id);
      clearRefreshCookie(res);
      logger.warn("Refresh token reuse detected, clearing all tokens", { module: MODULE, user_id: decoded.userId });
      throw new AuthError("Refresh token reuse detected");
    }

    await userRepository.removeRefreshToken(user._id, validToken.tokenHash);

    const tokenPayload = buildAuthTokenPayload(user);

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_SALT_ROUNDS);
    const newRefreshTokenDoc: IRefreshToken = {
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + ENV.refreshTokenExpiresInMs),
      createdAt: new Date(),
    };

    await userRepository.addRefreshToken(user._id, newRefreshTokenDoc);
    setRefreshCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  async logout(userId: string | undefined, refreshTokenFromCookie: string | undefined, res: Response): Promise<void> {
    let resolvedUserId = userId;

    if (!resolvedUserId && refreshTokenFromCookie) {
      try {
        const decoded = verifyRefreshToken(refreshTokenFromCookie);
        resolvedUserId = decoded.userId;
      } catch {
        resolvedUserId = undefined;
      }
    }

    if (refreshTokenFromCookie && resolvedUserId) {
      const user = await userRepository.findByIdWithRefreshTokens(resolvedUserId);
      if (user) {
        const matchingToken = await findMatchingRefreshToken(
          user,
          refreshTokenFromCookie,
        );
        if (matchingToken) {
          await userRepository.removeRefreshToken(resolvedUserId, matchingToken.tokenHash);
        }
      }
    }

    clearRefreshCookie(res);

    if (resolvedUserId) {
      await auditRepository.log(
        AUDIT_SUBJECT_AUTH,
        "User logged out",
        ENTITY_TYPE_USER,
        resolvedUserId,
        resolvedUserId,
      );
    }
  }

  async forgotPassword(dto: ForgotPasswordDTO): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const resetToken = generateResetPasswordToken(user._id.toString());
    const resetPasswordUrl = new URL(
      buildResetPasswordPath(resetToken),
      ENV.frontendUrl,
    ).toString();

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div dir="rtl">
          <p>התקבלה בקשה לאיפוס הסיסמה שלך.</p>
          <p>
            כדי לאפס את הסיסמה, יש ללחוץ על הקישור הבא:
            <a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
          </p>
          <p>אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.</p>
        </div>
      `,
    });

    logger.info("Password reset requested", { module: MODULE, user_id: user._id.toString() });
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    let payload: ResetPasswordTokenPayload;
    try {
      payload = verifyResetPasswordToken(dto.token);
    } catch {
      throw new BadRequestError("Invalid or expired reset token");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    await userRepository.updateById(user._id, { $set: { passwordHash } });
    await userRepository.removeAllRefreshTokens(user._id);

    await auditRepository.log(
      AUDIT_SUBJECT_AUTH,
      "Password reset completed",
      ENTITY_TYPE_USER,
      user._id.toString(),
      user._id,
    );

    logger.info("Password reset completed", { module: MODULE, user_id: user._id.toString() });
  }
}

export const authService = new AuthService();
