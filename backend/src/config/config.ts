import dotenv from "dotenv";
import { NODE_ENV_VALUES, UPLOAD } from "@petec/shared";
import { z } from "zod";
import configFile from "./config.json";
import {
  normalizeDurationString,
  parseDurationToMilliseconds,
} from "./config.utils";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().min(1),
  NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
  FRONTEND_URL: z.string().min(1),
  MAIL_ADMIN: z.email().optional(),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_RESET_PASSWORD_SECRET: z.string().min(10).optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("30m"),

  MJ_APIKEY_PUBLIC: z.string(),
  MJ_APIKEY_PRIVATE: z.string(),
  UPLOAD_DIR: z.string().default(UPLOAD.ROOT_DIR_NAME),
});

type ParsedEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({ ...process.env, ...configFile });

if (!parsed.success) {
  const formatted = z.treeifyError(parsed.error);
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(formatted)}`
  );
}

const envs: ParsedEnv = parsed.data;
const accessTokenExpiresIn = normalizeDurationString(
  envs.ACCESS_TOKEN_EXPIRES_IN
);
const refreshTokenExpiresIn = normalizeDurationString(
  envs.REFRESH_TOKEN_EXPIRES_IN
);
const accessTokenExpiresInMs =
  parseDurationToMilliseconds(accessTokenExpiresIn);
const refreshTokenExpiresInMs = parseDurationToMilliseconds(
  refreshTokenExpiresIn
);

export const ENV = {
  port: envs.PORT,
  mongoDBUri: envs.MONGODB_URI,
  nodeEnv: envs.NODE_ENV,
  isProduction: envs.NODE_ENV === "production",
  isDevelopment: envs.NODE_ENV === "development",
  isTest: envs.NODE_ENV === "test",
  frontendUrl: envs.FRONTEND_URL,
  mailAdmin: envs.MAIL_ADMIN ?? "",
  jwtAccessSecret: envs.JWT_ACCESS_SECRET,
  jwtRefreshSecret: envs.JWT_REFRESH_SECRET,
  jwtResetPasswordSecret:
    envs.JWT_RESET_PASSWORD_SECRET ?? envs.JWT_ACCESS_SECRET,
  mailjetPublicKey: envs.MJ_APIKEY_PUBLIC ?? "",
  mailjetPrivateKey: envs.MJ_APIKEY_PRIVATE ?? "",
  uploadDir: envs.UPLOAD_DIR,
  accessTokenExpiresIn,
  accessTokenExpiresInMs,
  refreshTokenExpiresIn,
  refreshTokenExpiresInMs,
} as const;
