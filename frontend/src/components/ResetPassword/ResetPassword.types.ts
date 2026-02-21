import { ResetPasswordDTO } from "@petec/shared";

export type IResetPasswordForm = ResetPasswordDTO & { confirmPassword: string };
