import { useMutation } from "@tanstack/react-query";
import { authApi } from "../auth.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { ResetPasswordDTO } from "@petec/shared";
import { AppRoutes } from "../../../config/app-routes";

export function useResetPassword(token: string | undefined) {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (values: ResetPasswordDTO) => {
            if (!token) throw new Error("חסר טוקן לאיפוס סיסמה");
            return authApi.resetPassword({ token, password: values.password });
        },
        onSuccess: () => {
            toast.success("הסיסמה אופסה בהצלחה");
            navigate(AppRoutes.Login, { replace: true });
        },
    });
}
