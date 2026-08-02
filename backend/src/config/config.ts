import dotenv from "dotenv";
import { NODE_ENV_VALUES, UPLOAD } from "@petec/shared";
import { z } from "zod";
import configFile from "./config.json" with { type: "json" };
import {
  normalizeDurationString,
  parseDurationToMilliseconds,
} from "./config.utils.js";

dotenv.config();

const GROQ_STRUCTURED_OUTPUT_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
] as const;

const optionalBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
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
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(""),
  CLOUDINARY_API_KEY: z.string().trim().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().trim().optional().default(""),
  UPLOAD_DIR: z.string().default(UPLOAD.ROOT_DIR_NAME),
  CLINICA_URL: z.string().url(),
  CLINIC_USERNAME: z.string().optional(),
  CLINIC_PASSWORD: z.string().optional(),
  AI_CASE_SUGGESTIONS_ENABLED: optionalBooleanSchema.default(false),
  GROQ_API_KEY: z.string().trim().optional().default(""),
  GROQ_MODEL: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.enum(GROQ_STRUCTURED_OUTPUT_MODELS),
    )
    .default("openai/gpt-oss-20b"),
  GROQ_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(8_000),
}).superRefine((environment, context) => {
  if (environment.AI_CASE_SUGGESTIONS_ENABLED && !environment.GROQ_API_KEY) {
    context.addIssue({
      code: "custom",
      path: ["GROQ_API_KEY"],
      message: "GROQ_API_KEY is required when AI case suggestions are enabled",
    });
  }
});

type ParsedEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({ ...process.env, ...configFile });

if (!parsed.success) {
  const formatted = z.treeifyError(parsed.error);
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(formatted)}`,
  );
}

const envs: ParsedEnv = parsed.data;
const accessTokenExpiresIn = normalizeDurationString(
  envs.ACCESS_TOKEN_EXPIRES_IN,
);
const refreshTokenExpiresIn = normalizeDurationString(
  envs.REFRESH_TOKEN_EXPIRES_IN,
);
const accessTokenExpiresInMs =
  parseDurationToMilliseconds(accessTokenExpiresIn);
const refreshTokenExpiresInMs = parseDurationToMilliseconds(
  refreshTokenExpiresIn,
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
  cloudinaryCloudName: envs.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: envs.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: envs.CLOUDINARY_API_SECRET,
  uploadDir: envs.UPLOAD_DIR,
  accessTokenExpiresIn,
  accessTokenExpiresInMs,
  refreshTokenExpiresIn,
  refreshTokenExpiresInMs,
  clinicaBaseUrl: envs.CLINICA_URL,
  clinicUsername: envs.CLINIC_USERNAME ?? "",
  clinicPassword: envs.CLINIC_PASSWORD ?? "",
  aiCaseSuggestionsEnabled: envs.AI_CASE_SUGGESTIONS_ENABLED,
  groqApiKey: envs.GROQ_API_KEY,
  groqModel: envs.GROQ_MODEL,
  groqTimeoutMs: envs.GROQ_TIMEOUT_MS,
} as const;
