export const Role = {
    ADMIN: "ADMIN",
    DOCTOR: "DOCTOR",
    ASSISTANT: "ASSISTANT",
    RECEPTION: "RECEPTION",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLES = Object.values(Role);

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
    [Role.ADMIN]: [Permission.WILDCARD],
    [Role.DOCTOR]: [
        Permission.READ_PATIENT,
        Permission.WRITE_PATIENT,
        Permission.READ_CASE,
        Permission.WRITE_CASE,
        Permission.WRITE_CASE_DAILY,
        Permission.MANAGE_DOCUMENTS,
        Permission.READ_AUDIT,
    ],
    [Role.ASSISTANT]: [
        Permission.READ_PATIENT,
        Permission.READ_CASE,
        Permission.WRITE_CASE_DAILY,
        Permission.MANAGE_DOCUMENTS,
    ],
    [Role.RECEPTION]: [
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

export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export const ErrorCode = {
    VALIDATION_FAILED: "VALIDATION_FAILED",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    CONFLICT: "CONFLICT",
    RATE_LIMITED: "RATE_LIMITED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    BAD_REQUEST: "BAD_REQUEST",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

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

export const RATE_LIMIT = {
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_REQUESTS: 20,
    GLOBAL_WINDOW_MS: 15 * 60 * 1000,
    GLOBAL_MAX_REQUESTS: 100,
} as const;

export const UPLOAD = {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_MIME_TYPES: [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ] as readonly string[],
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
} as const;

export const PASSWORD_POLICY = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
} as const;

export const TABLE_ALLOW_LIST = [
    "patients",
    "cases",
    "audit_logs",
    "users",
    "animal_types",
    "race_types",
    "animal_colors",
    "animal_vitals",
    "gender_types",
    "insurance_types",
    "food_types",
    "food_extra_types",
    "examination_types",
    "feces_types",
    "urine_types",
    "dosage_frequencies",
    "measure_unit_types",
    "procedure_types",
    "medicines",
    "medicine_categories",
    "routes_of_administration",
    "patient_document_types",
] as const;
export type AllowedTableName = (typeof TABLE_ALLOW_LIST)[number];

export const SYSTEM_TYPE_NAMES = {
    ANIMAL_TYPES: "animal_types",
    RACE_TYPES: "race_types",
    ANIMAL_COLORS: "animal_colors",
    ANIMAL_VITALS: "animal_vitals",
    GENDER_TYPES: "gender_types",
    INSURANCE_TYPES: "insurance_types",
    FOOD_TYPES: "food_types",
    FOOD_EXTRA_TYPES: "food_extra_types",
    EXAMINATION_TYPES: "examination_types",
    FECES_TYPES: "feces_types",
    URINE_TYPES: "urine_types",
    DOSAGE_FREQUENCIES: "dosage_frequencies",
    MEASURE_UNIT_TYPES: "measure_unit_types",
    PROCEDURE_TYPES: "procedure_types",
    MEDICINES: "medicines",
    MEDICINE_CATEGORIES: "medicine_categories",
    ROUTES_OF_ADMINISTRATION: "routes_of_administration",
    PATIENT_DOCUMENT_TYPES: "patient_document_types",
} as const;
export type SystemTypeName = (typeof SYSTEM_TYPE_NAMES)[keyof typeof SYSTEM_TYPE_NAMES];

export const ROUTES = {
    HEALTH: "/health",
    AUTH: "/api/v1/auth",
    USERS: "/api/v1/users",
    PATIENT: "/api/v1/patient",
    ADMIN: "/api/v1/admin",
    MEDICINE: "/api/v1/medicine",
    TABLE: "/api/v1/table",
} as const;

export const JSON_BODY_LIMIT = "10kb";

export const APP_EXIT_CODE_ERROR = 1;
