import dotenv from "dotenv";
import { z } from "zod";
import configFile from "./config.json";

dotenv.config();

const NODE_ENV_VALUES = ["development", "production", "test"] as const;

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
  FRONTEND_URL: z.string().min(1),
  MAIL_ADMIN: z.string().email().optional(),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_RESET_PASSWORD_SECRET: z.string().min(10).optional(),

  MJ_APIKEY_PUBLIC: z.string().optional(),
  MJ_APIKEY_PRIVATE: z.string().optional(),
});

type ParsedEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({...process.env,...configFile});

if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
}

const data: ParsedEnv = parsed.data;

export const ENV = {
  port: data.PORT,
  mongoDBUri: data.MONGODB_URI,
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === "production",
  isDevelopment: data.NODE_ENV === "development",
  isTest: data.NODE_ENV === "test",
  frontendUrl: data.FRONTEND_URL,
  mailAdmin: data.MAIL_ADMIN ?? "",
  jwtAccessSecret: data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: data.JWT_REFRESH_SECRET,
  jwtResetPasswordSecret: data.JWT_RESET_PASSWORD_SECRET ?? data.JWT_ACCESS_SECRET,
  mailjetPublicKey: data.MJ_APIKEY_PUBLIC ?? "",
  mailjetPrivateKey: data.MJ_APIKEY_PRIVATE ?? "",
} as const;
