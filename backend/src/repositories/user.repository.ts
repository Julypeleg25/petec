import { BaseRepository } from "./base.repository";
import { UserModel } from "@models/User";
import type { IUser, UserDocument, IRefreshToken } from "@models/User";
import type { Types } from "mongoose";
import { Role, UserStatus } from "@petec/shared";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.model.findOne({ username }).exec();
  }

  async findByUsernameWithPassword(username: string): Promise<UserDocument | null> {
    return this.model.findOne({ username }).select("+passwordHash").exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select("+passwordHash").exec();
  }

  async findByIdWithRefreshTokens(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.model.findById(id).select("+refreshTokens").exec();
  }

  async addRefreshToken(userId: string | Types.ObjectId, token: IRefreshToken): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $push: { refreshTokens: token } },
    ).exec();
  }

  async removeRefreshToken(userId: string | Types.ObjectId, tokenHash: string): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { tokenHash } } },
    ).exec();
  }

  async removeAllRefreshTokens(userId: string | Types.ObjectId): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $set: { refreshTokens: [] } },
    ).exec();
  }

  async updateLastLogin(userId: string | Types.ObjectId): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $set: { lastLogin: new Date() } },
    ).exec();
  }

  async findByRole(role: Role): Promise<UserDocument[]> {
    return this.model.find({ role, status: UserStatus.ACTIVE, isDeleted: { $ne: true } }).exec();
  }
}

export const userRepository = new UserRepository();
