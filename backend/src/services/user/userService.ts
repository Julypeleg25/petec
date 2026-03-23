import { userRepository } from "../../repositories/user/index.js";
import { auditRepository } from "../../repositories/audit/index.js";
import { logger } from "../../config/logger.js";
import { NotFoundError } from "../../constants/error.constants.js";
import { type UpdateUserDTO, type UserResponseDTO, type UserRowDTO, type StaffMemberDTO, roles } from "@petec/shared";
import { mapUserToResponse, mapUserToRow, mapUserToStaffMember } from "../../mappers/user/user.mappers.js";

const ENTITY_TYPE = "User";
const AUDIT_SUBJECT = "User Management";
const MODULE = "user";

export class UserService {
    async getAllUsers(): Promise<UserRowDTO[]> {
        const users = await userRepository.findMany({ isDeleted: { $ne: true } }, { sort: { email: 1 } });
        return users.map(mapUserToRow);
    };

    async getDoctors(): Promise<StaffMemberDTO[]> {
        const users = await userRepository.findByRole(roles.DOCTOR);
        return users.map(mapUserToStaffMember);
    };

    async getNurses(): Promise<StaffMemberDTO[]> {
        const users = await userRepository.findByRole(roles.ASSISTANT);
        return users.map(mapUserToStaffMember);
    };

    async getUserById(userId: string): Promise<UserResponseDTO | null> {
        const user = await userRepository.findById(userId);
        return user ? mapUserToResponse(user) : null;
    };

    async updateUser(userId: string, data: UpdateUserDTO): Promise<UserResponseDTO | null> {
        const user = await userRepository.updateById(userId, { $set: data });
        if (!user) {
            throw new NotFoundError("User not found");
        }
        await auditRepository.log(AUDIT_SUBJECT, `User updated: ${user.email}`, ENTITY_TYPE, userId, userId);
        logger.info("User updated", { module: MODULE, user_id: userId });
        return mapUserToResponse(user);
    };

    async deleteUser(userId: string): Promise<void> {
        const user = await userRepository.updateById(userId, { $set: { isDeleted: true } });
        if (!user) {
            throw new NotFoundError("User not found");
        }
        await auditRepository.log(AUDIT_SUBJECT, `User deleted: ${user.email}`, ENTITY_TYPE, userId, userId);
        logger.info("User deleted", { module: MODULE, user_id: userId });
    };
}

export const userService = new UserService();
