export const roles = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  ASSISTANT: "ASSISTANT",
  RECEPTION: "RECEPTION",
} as const;
export type Role = (typeof roles)[keyof typeof roles];

export const Permission = {
  READ_PATIENT: "read:patient",
  WRITE_PATIENT: "write:patient",
  READ_CASE: "read:case",
  WRITE_CASE: "write:case",
  WRITE_CASE_DAILY: "write:case_daily_details",
  WRITE_DEMOGRAPHICS: "write:patient_demographics",
  READ_AUDIT: "read:audit",
  MANAGE_USERS: "manage:users",
  MANAGE_SYSTEM_TYPES: "manage:system_types",
  MANAGE_DOCUMENTS: "manage:documents",
  WILDCARD: "*",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [roles.ADMIN]: [Permission.WILDCARD],
  [roles.DOCTOR]: [
    Permission.READ_PATIENT,
    Permission.WRITE_PATIENT,
    Permission.READ_CASE,
    Permission.WRITE_CASE,
    Permission.WRITE_CASE_DAILY,
    Permission.MANAGE_DOCUMENTS,
    Permission.READ_AUDIT,
  ],
  [roles.ASSISTANT]: [
    Permission.READ_PATIENT,
    Permission.READ_CASE,
    Permission.WRITE_CASE_DAILY,
    Permission.MANAGE_DOCUMENTS,
  ],
  [roles.RECEPTION]: [
    Permission.READ_PATIENT,
    Permission.WRITE_DEMOGRAPHICS,
    Permission.READ_CASE,
  ],
} as const;

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
