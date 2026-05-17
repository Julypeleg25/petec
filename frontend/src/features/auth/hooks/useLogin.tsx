import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { LoginDTO, LoginResponseDTO } from "@petec/shared";
import { authApi } from "../auth.api";
import { useAuth } from "../AuthProvider";
import type { TypedAxiosError } from "../../../types";
import { AppRoutes } from "../../../config/appRoutes";
import { toHebrewErrorMessage } from "../../../lib/errorMessages";

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
            toast.error(toHebrewErrorMessage(error));
        },
    });
}
