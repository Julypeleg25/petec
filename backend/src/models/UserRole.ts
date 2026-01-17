import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserRole extends Document {
  name: string;
  privileges: Types.ObjectId[];
  createdAt: Date;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    privileges: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserPrivilege",
        required: true,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const UserRoleModel = mongoose.model<IUserRole>(
  "UserRole",
  userRoleSchema
);
