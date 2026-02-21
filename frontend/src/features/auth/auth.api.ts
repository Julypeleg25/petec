import {
    requestNoContent,
    requestWithRequestAndResponseSchema,
    requestWithRequestSchemaNoContent,
    requestWithSchema,
} from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
import {
    LoginDTO,
    LoginDTOSchema,
    LoginResponseDTO,
    LoginResponseSchema,
    ForgotPasswordDTO,
    ForgotPasswordDTOSchema,
    ResetPasswordDTO,
    ResetPasswordDTOSchema,
    RegisterDTO,
    RegisterDTOSchema,
    RegisterResponseDTO,
    RegisterResponseDTOSchema,
    RefreshResponseDTO,
    RefreshResponseSchema,
    ForgotPasswordMessageDTO,
    ForgotPasswordMessageSchema,
    UserRolesResponseDTO,
    UserRolesResponseSchema,
} from "@petec/shared";

export const authApi = {
    login: (dto: LoginDTO): Promise<LoginResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.auth.login },
            dto,
            LoginDTOSchema,
            LoginResponseSchema,
        ),

    register: (dto: RegisterDTO): Promise<RegisterResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.auth.register },
            dto,
            RegisterDTOSchema,
            RegisterResponseDTOSchema,
        ),

    refresh: (): Promise<RefreshResponseDTO> =>
        requestWithSchema({ method: "post", url: API_ROUTES.auth.refresh }, RefreshResponseSchema),

    logout: (): Promise<void> =>
        requestNoContent({ method: "post", url: API_ROUTES.auth.logout }),

    forgotPassword: (dto: ForgotPasswordDTO): Promise<ForgotPasswordMessageDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.auth.forgotPassword },
            dto,
            ForgotPasswordDTOSchema,
            ForgotPasswordMessageSchema,
        ),

    resetPassword: (dto: ResetPasswordDTO): Promise<void> =>
        requestWithRequestSchemaNoContent(
            { method: "post", url: API_ROUTES.auth.resetPassword },
            dto,
            ResetPasswordDTOSchema,
        ),

    getUserRoles: (): Promise<UserRolesResponseDTO> =>
        requestWithSchema({ method: "get", url: API_ROUTES.auth.userRoles }, UserRolesResponseSchema),
};
