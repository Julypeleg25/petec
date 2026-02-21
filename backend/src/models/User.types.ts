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
  email: string;
  passwordHash: string;
  role: Role;
  privileges: string[];
  status: UserStatus;
  refreshTokens: IRefreshToken[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;
