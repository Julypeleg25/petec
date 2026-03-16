import type { HydratedDocument, Types } from "mongoose";
import type { Role, UserStatus } from "@petec/shared";

export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  privileges: string[];
  status: UserStatus;
  isDeleted: boolean;
  refreshTokens: IRefreshToken[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;
