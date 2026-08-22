import { z } from "zod";
import { PASSWORD_POLICY, roles } from "../constants/index.js";

const passwordSchema = z
  .string()
  .min(
    PASSWORD_POLICY.MIN_LENGTH,
    `סיסמה חייבת להכיל לפחות ${PASSWORD_POLICY.MIN_LENGTH} תווים`,
  )
  .max(
    PASSWORD_POLICY.MAX_LENGTH,
    `סיסמה יכולה להכיל עד ${PASSWORD_POLICY.MAX_LENGTH} תווים`,
  )
  .refine((val) => /[A-Z]/.test(val), {
    message: "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "הסיסמה חייבת להכיל לפחות ספרה אחת",
  });

export const RegisterDTOSchema = z.object({
  username: z.string().min(3, "שם המשתמש חייב להכיל לפחות 3 תווים").trim(),
  firstName: z.string().min(1, "שם פרטי הוא שדה חובה").trim(),
  lastName: z.string().min(1, "שם משפחה הוא שדה חובה").trim(),
  email: z.email("כתובת אימייל לא תקינה").trim().toLowerCase(),
  password: passwordSchema,
  role: z.enum(roles).default(roles.DOCTOR),
  privileges: z.array(z.string()).optional(),
});
export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

export const LoginDTOSchema = z.object({
  username: z.string().min(1, "יש להזין שם משתמש").trim(),
  password: z.string().min(1, "יש להזין סיסמה"),
});
export type LoginDTO = z.infer<typeof LoginDTOSchema>;

export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

export const ForgotPasswordDTOSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה").trim().toLowerCase(),
});
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTOSchema>;

export const ResetPasswordDTOSchema = z.object({
  token: z.string().min(1, "אסימון איפוס חסר"),
  password: passwordSchema,
});
export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTOSchema>;

export const ResetPasswordFormDTOSchema = ResetPasswordDTOSchema.extend({
  confirmPassword: z.string().min(1, "יש להזין אימות סיסמה"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});
export type ResetPasswordFormDTO = z.infer<typeof ResetPasswordFormDTOSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    fullName: z.string(),
    email: z.string(),
    role: z.enum(roles),
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
export type ForgotPasswordMessageDTO = z.infer<
  typeof ForgotPasswordMessageSchema
>;
