import mongoose, { Schema, Model } from "mongoose";
import { Role, UserStatus } from "@petec/shared";
import type { IRefreshToken, IUser } from "./User.types";

const refreshTokenSubSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<IUser, Model<IUser>>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      index: true,
    },
    privileges: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    refreshTokens: {
      type: [refreshTokenSubSchema],
      default: [],
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = mongoose.model<IUser>("User", userSchema);

export type { IRefreshToken, IUser, UserDocument } from "./User.types";
