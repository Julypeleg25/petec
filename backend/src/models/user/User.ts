import mongoose, { Schema, Model } from "mongoose";
import { roles, UserStatus } from "@petec/shared";
import type { IRefreshToken, IUser } from "./User.types.js";

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
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
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
      enum: Object.values(roles),
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
    isDeleted: {
      type: Boolean,
      default: false,
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

export const UserModel = mongoose.model<IUser>("User", userSchema, "users");

export type { IRefreshToken, IUser, UserDocument } from "./User.types.js";
