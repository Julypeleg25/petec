import { LoginSchema, RegisterSchema, ResetPasswordSchema } from "@schemas/auth.schema";
import { z } from "zod";

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
