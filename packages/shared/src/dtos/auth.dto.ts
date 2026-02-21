import { z } from "zod";
import { PASSWORD_POLICY, Role, ROLES_TUPLE } from "../constants";

const passwordSchema = z.string()
  .min(PASSWORD_POLICY.MIN_LENGTH, `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`)
  .max(PASSWORD_POLICY.MAX_LENGTH, `Password must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters`)
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: "Password must contain at least one uppercase letter" },
  )
  .refine(
    (val) => /[a-z]/.test(val),
    { message: "Password must contain at least one lowercase letter" },
  )
  .refine(
    (val) => /[0-9]/.test(val),
    { message: "Password must contain at least one number" },
  );

export const RegisterDTOSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").trim(),
  email: z.email().trim().toLowerCase(),
  password: passwordSchema,
  role: z.enum(ROLES_TUPLE).default(Role.DOCTOR),
  privileges: z.array(z.string()).optional(),
});
export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

export const LoginDTOSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});
export type LoginDTO = z.infer<typeof LoginDTOSchema>;

export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

export const ForgotPasswordDTOSchema = z.object({
  email: z.email().trim().toLowerCase(),
});
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTOSchema>;

export const ResetPasswordDTOSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});
export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTOSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
    privileges: z.array(z.string()),
    lastLogin: z.string().optional(),
  }),
});
export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponseDTO = z.infer<typeof RefreshResponseSchema>;

export const ForgotPasswordMessageSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordMessageDTO = z.infer<typeof ForgotPasswordMessageSchema>;

export const UserRolesResponseSchema = z.array(z.string());
export type UserRolesResponseDTO = z.infer<typeof UserRolesResponseSchema>;
