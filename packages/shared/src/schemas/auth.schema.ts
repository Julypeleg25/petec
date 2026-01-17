import { z } from "zod";

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "Invalid username"),

  email: z.string().email(),

  password: z
    .string()
    .min(8)
    .max(150)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),

  firstName: z.string().min(1).max(30),
  lastName: z.string().min(1).max(30),

  role: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role id"),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(8),
  token: z.string().min(1),
});
