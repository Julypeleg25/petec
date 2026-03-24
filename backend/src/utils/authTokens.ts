import jwt from "jsonwebtoken";
import { ENV } from "../config/config.js";
import { TOKEN_EXPIRY, COOKIE_OPTIONS, COOKIE_NAMES } from "@petec/shared";
import type { TokenPayload, ResetPasswordTokenPayload } from "@petec/shared";
import type { Response, CookieOptions } from "express";

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
  return jwt.verify(token, ENV.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.jwtRefreshSecret) as TokenPayload;
};

export const generateResetPasswordToken = (userId: string): string => {
  return jwt.sign({ userId }, ENV.jwtResetPasswordSecret, {
    expiresIn: TOKEN_EXPIRY.RESET_PASSWORD,
  });
};

export const verifyResetPasswordToken = (token: string): ResetPasswordTokenPayload => {
  return jwt.verify(token, ENV.jwtResetPasswordSecret) as ResetPasswordTokenPayload;
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
