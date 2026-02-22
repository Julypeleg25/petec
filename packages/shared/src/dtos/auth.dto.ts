import { z } from "zod";
import { Role } from "../constants/index";
import { PASSWORD_POLICY } from "../constants/index";

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
  email: z.email().trim().toLowerCase(),
  password: passwordSchema,
  role: z.enum(Role).default(Role.DOCTOR),
  privileges: z.array(z.string()).optional(),
});
export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

export const LoginDTOSchema = z.object({
  email: z.email().trim().toLowerCase(),
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
