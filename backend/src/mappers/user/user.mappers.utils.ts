import { Role, UserStatus } from "@petec/shared";
import type { IUser } from "@models/user";
import { toMapperIdString } from "@mappers/common/common.mappers.utils";

export type UserMapperInput = Partial<
    Pick<
        IUser,
        "_id" | "username" | "firstName" | "lastName" | "email" | "role" | "privileges" | "status" | "isDeleted" | "lastLogin" | "createdAt" | "updatedAt"
    >
> & {
    _id?: string | { toString(): string };
    role?: Role | string;
    status?: UserStatus | string;
    lastLogin?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

export const toUserIdString = (value: UserMapperInput["_id"]): string => {
    return toMapperIdString(value);
};

export const toUserIsoString = (value?: Date | string): string => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

export const toUserStatus = (status?: UserStatus | string): UserStatus =>
    status === UserStatus.INACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

export const toFullName = (firstName?: string, lastName?: string): string => {
    const parts = [firstName ?? "", lastName ?? ""].map(s => s.trim()).filter(Boolean);
    return parts.join(" ");
};
