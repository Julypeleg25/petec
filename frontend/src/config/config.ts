import { NODE_ENV_VALUES } from "@petec/shared";
import { z } from "zod";
import configFile from "./config.json";

const envSchema = z.object({
  API_URL: z.string().min(1).default("http://localhost:5001"),
  NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
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

export const ENV = {
  API_URL: envs.API_URL,
} as const;
