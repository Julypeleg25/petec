import { useMutation } from "@tanstack/react-query";
import { authApi } from "../auth.api";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { LoginDTO, LoginResponseDTO } from "@petec/shared";
import type { TypedAxiosError } from "../../../types";
import { AppRoutes } from "../../../config/app-routes";

export function useLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (values: LoginDTO) => authApi.login(values),
        onSuccess: (data: LoginResponseDTO) => {
            login(data);
            navigate(AppRoutes.Patients.List, { replace: true });
        },
        onError: (error: TypedAxiosError) => {
            const errData = error.response?.data?.error;
            const message =
                typeof errData === "string" ? errData : errData?.message ?? "כניסה נכשלה";
            toast.error(message);
        },
    });
}
