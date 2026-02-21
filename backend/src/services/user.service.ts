import { userRepository } from "@repositories/user.repository";
import { Role, UserStatus } from "@petec/shared";
import type { UpdateUserDTO, UserResponseDTO } from "@petec/shared";
import type { UserDocument } from "@models/User";

const mapUserToResponse = (user: UserDocument): UserResponseDTO => ({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    privileges: user.privileges,
    status: user.status,
    lastLogin: user.lastLogin?.toISOString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
});

export class UserService {
    async getAllUsers(): Promise<UserResponseDTO[]> {
        const users = await userRepository.findMany({}, { sort: { email: 1 } });
        return users.map(mapUserToResponse);
    };

    async getDoctors(): Promise<UserResponseDTO[]> {
        const users = await userRepository.findByRole(Role.DOCTOR);
        return users.map(mapUserToResponse);
    };

    async getNurses(): Promise<UserResponseDTO[]> {
        const users = await userRepository.findByRole(Role.ASSISTANT);
        return users.map(mapUserToResponse);
    };

    async getUserById(userId: string): Promise<UserResponseDTO | null> {
        const user = await userRepository.findById(userId);
        return user ? mapUserToResponse(user) : null;
    };

    async updateUser(userId: string, data: UpdateUserDTO): Promise<UserResponseDTO | null> {
        const user = await userRepository.updateById(userId, { $set: data });
        return user ? mapUserToResponse(user) : null;
    };

    async deleteUser(userId: string): Promise<void> {
        await userRepository.updateById(userId, { $set: { status: UserStatus.INACTIVE } });
    };
}

export const userService = new UserService();
