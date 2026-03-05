import type { Role, StaffMemberDTO, UserResponseDTO, UserRowDTO } from "@petec/shared";
import type { UserDocument } from "@models/User";
import {
    toFullName,
    toUserIdString,
    toUserIsoString,
    toUserStatus,
    type UserMapperInput,
} from "./user.mappers.utils";

export const mapUserToResponse = (user: UserMapperInput | UserDocument): UserResponseDTO => ({
    id: toUserIdString(user._id),
    username: user.username ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    fullName: toFullName(user.firstName, user.lastName),
    email: user.email ?? "",
    role: user.role as Role,
    privileges: Array.isArray(user.privileges) ? user.privileges : [],
    status: toUserStatus(user.status),
    lastLogin: toUserIsoString(user.lastLogin) || undefined,
    createdAt: toUserIsoString(user.createdAt),
    updatedAt: toUserIsoString(user.updatedAt),
});

export const mapUserToRow = (user: UserMapperInput | UserDocument): UserRowDTO => {
    const role = user.role as Role;
    return {
        id: toUserIdString(user._id),
        username: user.username ?? "",
        first_name: user.firstName ?? "",
        last_name: user.lastName ?? "",
        email: user.email ?? "",
        role,
        role_name: role,
        privileges: Array.isArray(user.privileges) ? user.privileges : [],
        status: toUserStatus(user.status),
        lastLogin: toUserIsoString(user.lastLogin) || undefined,
        createdAt: toUserIsoString(user.createdAt),
        updatedAt: toUserIsoString(user.updatedAt),
    };
};

export const mapUserToStaffMember = (user: UserMapperInput | UserDocument): StaffMemberDTO => ({
    id: toUserIdString(user._id),
    username: user.username ?? "",
    fullName: toFullName(user.firstName, user.lastName),
    email: user.email ?? "",
    role: user.role as Role,
});
