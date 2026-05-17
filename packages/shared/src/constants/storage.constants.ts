
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  AUTH_USER: "authUser",
  USER_ID: "userId",
  USER_ROLE: "userRole",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
