export const NODE_ENV_VALUES = ["development", "production", "test"] as const;

export type NodeEnv = (typeof NODE_ENV_VALUES)[number];
