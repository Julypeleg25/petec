import { NODE_ENV_VALUES, type NodeEnv } from "@petec/shared";
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .min(1)
    .default("https://petec-production.up.railway.app"),
  VITE_NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
});

type ParsedEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
});

if (!parsed.success) {
  const formatted = z.treeifyError(parsed.error);
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(formatted)}`,
  );
}

const envs: ParsedEnv = parsed.data;
const nodeEnv: NodeEnv = envs.VITE_NODE_ENV;

export const ENV = {
  API_URL: envs.VITE_API_URL,
  NODE_ENV: nodeEnv,
} as const;
