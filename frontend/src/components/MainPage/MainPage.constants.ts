export const MAIN_PAGE_TYPES = {
  PATIENTS: "patients",
  SYSTEM_MANAGEMENT: "system-management",
} as const;

export type MainPageType =
  (typeof MAIN_PAGE_TYPES)[keyof typeof MAIN_PAGE_TYPES];

export const SYSTEM_MANAGEMENT_TAB_TYPES = {
  USERS: "users",
  SYSTEM_TYPES: "system-types",
  HISTORY: "history",
} as const;

export type SystemManagementTabType =
  (typeof SYSTEM_MANAGEMENT_TAB_TYPES)[keyof typeof SYSTEM_MANAGEMENT_TAB_TYPES];
