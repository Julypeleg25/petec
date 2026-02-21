import { useMutation } from "@tanstack/react-query";
import { authApi } from "../auth.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { ForgotPasswordDTO } from "@petec/shared";
import { AppRoutes } from "../../../config/app-routes";

export function useForgotPassword() {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (values: ForgotPasswordDTO) => authApi.forgotPassword(values),
        onSuccess: () => {
            toast.success("הוראות לאיפוס הסיסמה נשלחו לכתובת המייל שלך");
            navigate(AppRoutes.Login);
        },
    });
}
