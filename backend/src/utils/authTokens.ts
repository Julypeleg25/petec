import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { ENV } from "@config/config";
import { COOKIE } from "@config/constants";
import { IUser } from "@models/User";

export interface JwtUserPayload extends JwtPayload {
  userId: string;
  userRole: string;
  userFullName: string;
}

export const generateTokens = (user: IUser) => {
  const payload = {
    userId: user._id,
    userRole: user.role,
    userFullName: `${user.firstName} ${user.lastName}`,
  };

  const accessToken = jwt.sign(payload, ENV.jwtAccessSecret, {
    expiresIn: "30m",
  });
  const refreshToken = jwt.sign(payload, ENV.jwtRefreshSecret, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  try {
    return jwt.verify(token, ENV.jwtAccessSecret) as JwtUserPayload;
  } catch (err) {
    throw new Error("Invalid access token");
  }
};

export const verifyRefreshToken = (token: string): JwtUserPayload => {
  try {
    return jwt.verify(token, ENV.jwtRefreshSecret) as JwtUserPayload;
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
};

export const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(COOKIE.REFRESH, refreshToken, {
    httpOnly: true,
    secure: ENV.nodeEnv === "production",
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(COOKIE.REFRESH, { path: "/auth/refresh" });
};
