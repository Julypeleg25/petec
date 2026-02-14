import jwt from "jsonwebtoken";
import { ENV } from "@config/config";
import { TOKEN_EXPIRY, COOKIE_OPTIONS, COOKIE_NAMES } from "@petec/shared";
import type { TokenPayload } from "@petec/shared";
import type { Response, CookieOptions } from "express";

export const generateAccessToken = (payload: Omit<TokenPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, ENV.jwtAccessSecret, {
    expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
  });
};

export const generateRefreshToken = (payload: Omit<TokenPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, ENV.jwtRefreshSecret, {
    expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
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

export const verifyResetPasswordToken = (token: string): { userId: string } => {
  return jwt.verify(token, ENV.jwtResetPasswordSecret) as { userId: string };
};

export const setRefreshCookie = (res: Response, token: string): void => {
  const options: CookieOptions = {
    httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
    secure: ENV.isProduction,
    sameSite: COOKIE_OPTIONS.SAME_SITE,
    maxAge: COOKIE_OPTIONS.MAX_AGE_MS,
    path: COOKIE_OPTIONS.REFRESH_PATH,
  };
  res.cookie(COOKIE_NAMES.REFRESH, token, options);
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAMES.REFRESH, {
    httpOnly: COOKIE_OPTIONS.HTTP_ONLY,
    secure: ENV.isProduction,
    sameSite: COOKIE_OPTIONS.SAME_SITE,
    path: COOKIE_OPTIONS.REFRESH_PATH,
  });
};
