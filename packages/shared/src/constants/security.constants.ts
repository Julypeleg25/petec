export const BCRYPT_SALT_ROUNDS = 12;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "15m",
  REFRESH_TOKEN: "7d",
  RESET_PASSWORD: "1h",
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000,
  RESET_PASSWORD_MS: 60 * 60 * 1000,
} as const;

export const COOKIE_OPTIONS = {
  REFRESH_PATH: "/api/v1/auth",
  MAX_AGE_MS: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
  HTTP_ONLY: true,
  SAME_SITE: "strict" as const,
} as const;

export const COOKIE_NAMES = {
  REFRESH: "refreshToken",
} as const;

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
} as const;
