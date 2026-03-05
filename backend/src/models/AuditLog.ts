import mongoose, { Schema, Model } from "mongoose";
import type { IAuditLog } from "./AuditLog.types";

const auditLogSchema = new Schema<IAuditLog, Model<IAuditLog>>(
  {
    subject: { type: String },
    description: { type: String },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    performedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export type { IAuditLog, AuditLogDocument } from "./AuditLog.types";
