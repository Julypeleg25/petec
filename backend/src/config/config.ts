import dotenv from "dotenv";
import config from "./config.json";

dotenv.config();

export interface AppConfig {
  port: number;
  mongoDBUri: string;
  frontendUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  sessionSecret: string; //check
}

const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const ENV: AppConfig = {
  port: Number(process.env.PORT ?? config.port),

  mongoDBUri: process.env.MONGODB_URI ?? config.mongoDBUri,

  frontendUrl: process.env.FRONTEND_URL ?? config.frontendUrl,
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",

  sessionSecret: requireEnv("SESSION_SECRET"),
};
