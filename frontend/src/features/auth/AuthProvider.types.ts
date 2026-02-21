import type { AuthUser } from "../../types";
import type { LoginResponseDTO } from "@petec/shared";

export interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (response: LoginResponseDTO) => void;
    logout: () => void;
    updateUser: (user: AuthUser) => void;
}
