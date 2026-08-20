import jwt, { type Algorithm } from "jsonwebtoken";
import { ENV } from "../config/config.js";
import {
  TOKEN_EXPIRY,
  COOKIE_OPTIONS,
  COOKIE_NAMES,
  roles,
} from "@petec/shared";
import type { TokenPayload, ResetPasswordTokenPayload } from "@petec/shared";
import type { Response, CookieOptions } from "express";
import { z } from "zod";

const JWT_ALGORITHMS: Algorithm[] = ["HS256"];

const tokenPayloadSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(roles),
    privileges: z.array(z.string()),
    username: z.string().optional(),
    fullName: z.string().optional(),
    iat: z.number().optional(),
    exp: z.number().optional(),
  })
  .strict();

const resetPasswordTokenPayloadSchema = z
  .object({
    userId: z.string().min(1),
    iat: z.number().optional(),
    exp: z.number().optional(),
  })
  .strict();

export const generateAccessToken = (payload: Omit<TokenPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, ENV.jwtAccessSecret, {
    expiresIn: ENV.accessTokenExpiresIn,
  });
};

export const generateRefreshToken = (payload: Omit<TokenPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, ENV.jwtRefreshSecret, {
    expiresIn: ENV.refreshTokenExpiresIn,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return tokenPayloadSchema.parse(
    jwt.verify(token, ENV.jwtAccessSecret, { algorithms: JWT_ALGORITHMS }),
  );
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return tokenPayloadSchema.parse(
    jwt.verify(token, ENV.jwtRefreshSecret, { algorithms: JWT_ALGORITHMS }),
  );
};

export const generateResetPasswordToken = (userId: string): string => {
  return jwt.sign({ userId }, ENV.jwtResetPasswordSecret, {
    expiresIn: TOKEN_EXPIRY.RESET_PASSWORD,
  });
};

export const verifyResetPasswordToken = (token: string): ResetPasswordTokenPayload => {
  return resetPasswordTokenPayloadSchema.parse(
    jwt.verify(token, ENV.jwtResetPasswordSecret, {
      algorithms: JWT_ALGORITHMS,
    }),
  );
};

const getRefreshCookieSameSite = (): CookieOptions["sameSite"] =>
  ENV.isProduction ? "none" : "lax";

const buildRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
  secure: ENV.isProduction,
  sameSite: getRefreshCookieSameSite(),
  maxAge: ENV.refreshTokenExpiresInMs,
  path: COOKIE_OPTIONS.REFRESH_PATH,
});

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAMES.REFRESH, token, buildRefreshCookieOptions());
};

export const clearRefreshCookie = (res: Response): void => {
  const { maxAge, ...options } = buildRefreshCookieOptions();
  void maxAge;
  res.clearCookie(COOKIE_NAMES.REFRESH, options);
};
