import type { SafeJsonObject, SafeJsonValue } from "../types/sanitizer.types.js";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "accessToken",
  "refreshToken",
];
const MASK_VALUE = "***MASKED***";

const isPlainObject = (value: SafeJsonValue): value is SafeJsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const maskSensitiveData = (data: SafeJsonValue): SafeJsonValue => {
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  if (!isPlainObject(data)) {
    return data;
  }

  const masked: SafeJsonObject = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase()),
    );
    masked[key] = isSensitive ? MASK_VALUE : maskSensitiveData(value);
  }
  return masked;
};
