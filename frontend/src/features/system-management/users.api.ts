import {
    requestNoContent,
    requestWithRequestAndResponseSchema,
    requestWithSchema,
} from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";
import {
    StaffMemberDTO,
    StaffMemberListResponseDTOSchema,
    UserRowDTO,
    UserRowListResponseDTOSchema,
    RegisterDTO,
    RegisterDTOSchema,
    RegisterResponseDTO,
    RegisterResponseDTOSchema,
    UpdateUserDTO,
    UpdateUserDTOSchema,
    UserResponseDTO,
    UserResponseDTOSchema,
    UserIdParamsDTOSchema,
} from "@petec/shared";

export const usersApi = {
    getUsers: (): Promise<UserRowDTO[]> =>
        requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.admin.users }, UserRowListResponseDTOSchema),

    createUser: (dto: RegisterDTO): Promise<RegisterResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: HTTP_METHODS.POST, url: API_ROUTES.auth.register },
            dto,
            RegisterDTOSchema,
            RegisterResponseDTOSchema,
        ),

    updateUser: (id: string, dto: UpdateUserDTO): Promise<UserResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: HTTP_METHODS.PUT, url: API_ROUTES.admin.user.edit(UserIdParamsDTOSchema.parse({ userId: id }).userId) },
            dto,
            UpdateUserDTOSchema,
            UserResponseDTOSchema,
        ),

    deleteUser: (id: string): Promise<void> =>
        requestNoContent({
            method: HTTP_METHODS.DELETE,
            url: API_ROUTES.admin.user.delete(UserIdParamsDTOSchema.parse({ userId: id }).userId),
        }),

    getDoctors: (): Promise<StaffMemberDTO[]> =>
        requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.user.doctors }, StaffMemberListResponseDTOSchema),

    getNurses: (): Promise<StaffMemberDTO[]> =>
        requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.user.nurses }, StaffMemberListResponseDTOSchema),
};
