import {
  requestNoContent,
  requestWithRequestAndResponseSchema,
  requestWithRequestSchemaNoContent,
  requestWithSchema,
} from "../../lib/apiClient";
import { HTTP_METHODS } from "../../lib/http.constants";
import { API_ROUTES } from "../../config/apiRoutes";
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
  ForgotPasswordMessageSchema
} from "@petec/shared";

export const authApi = {
  login: (dto: LoginDTO): Promise<LoginResponseDTO> =>
    requestWithRequestAndResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.auth.login },
      dto,
      LoginDTOSchema,
      LoginResponseSchema,
    ),

  register: (dto: RegisterDTO): Promise<RegisterResponseDTO> =>
    requestWithRequestAndResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.auth.register },
      dto,
      RegisterDTOSchema,
      RegisterResponseDTOSchema,
    ),

  refresh: (): Promise<RefreshResponseDTO> =>
    requestWithSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.auth.refresh },
      RefreshResponseSchema,
    ),

  logout: (): Promise<void> =>
    requestNoContent({
      method: HTTP_METHODS.POST,
      url: API_ROUTES.auth.logout,
    }),

  forgotPassword: (dto: ForgotPasswordDTO): Promise<ForgotPasswordMessageDTO> =>
    requestWithRequestAndResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.auth.forgotPassword },
      dto,
      ForgotPasswordDTOSchema,
      ForgotPasswordMessageSchema,
    ),

  resetPassword: (dto: ResetPasswordDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: HTTP_METHODS.POST, url: API_ROUTES.auth.resetPassword },
      dto,
      ResetPasswordDTOSchema,
    ),
};
