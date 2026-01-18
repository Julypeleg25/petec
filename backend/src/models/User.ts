import mongoose, { Schema, Document, Types } from "mongoose";

export interface AuthenticatedUser {
  userId: string;
  userRole: string;
  userFullName: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;

  firstName: string;
  lastName: string;

  role: Types.ObjectId;

  refreshToken?: string | null;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /\S+@\S+\.\S+/,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 150,
      select: false,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    role: {
      type: Schema.Types.ObjectId,
      ref: "UserRole",
      required: [true, "User must have a role"],
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
