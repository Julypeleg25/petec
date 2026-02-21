import {
    requestNoContent,
    requestWithRequestAndResponseSchema,
    requestWithSchema,
} from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
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
    UserRolesResponseDTO,
    UserRolesResponseSchema,
    UserIdParamsDTOSchema,
} from "@petec/shared";

export const usersApi = {
    getUsers: (): Promise<UserRowDTO[]> =>
        requestWithSchema({ method: "get", url: API_ROUTES.admin.users }, UserRowListResponseDTOSchema),

    getRoles: (): Promise<UserRolesResponseDTO> =>
        requestWithSchema({ method: "get", url: API_ROUTES.auth.userRoles }, UserRolesResponseSchema),

    createUser: (dto: RegisterDTO): Promise<RegisterResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.auth.register },
            dto,
            RegisterDTOSchema,
            RegisterResponseDTOSchema,
        ),

    updateUser: (id: string, dto: UpdateUserDTO): Promise<UserResponseDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "put", url: API_ROUTES.admin.user.edit(UserIdParamsDTOSchema.parse({ userId: id }).userId) },
            dto,
            UpdateUserDTOSchema,
            UserResponseDTOSchema,
        ),

    deleteUser: (id: string): Promise<void> =>
        requestNoContent({
            method: "delete",
            url: API_ROUTES.admin.user.delete(UserIdParamsDTOSchema.parse({ userId: id }).userId),
        }),

    getDoctors: (): Promise<StaffMemberDTO[]> =>
        requestWithSchema({ method: "get", url: API_ROUTES.user.doctors }, StaffMemberListResponseDTOSchema),

    getNurses: (): Promise<StaffMemberDTO[]> =>
        requestWithSchema({ method: "get", url: API_ROUTES.user.nurses }, StaffMemberListResponseDTOSchema),
};
