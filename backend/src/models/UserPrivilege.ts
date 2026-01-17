import mongoose, { Schema, Document } from "mongoose";

export interface IUserPrivilege extends Document {
  name: string;
  description?: string | null;
  createdAt: Date;
}

const userPrivilegeSchema = new Schema<IUserPrivilege>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const UserPrivilegeModel = mongoose.model<IUserPrivilege>(
  "UserPrivilege",
  userPrivilegeSchema
);
