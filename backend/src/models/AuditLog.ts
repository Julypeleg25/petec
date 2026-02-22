import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

export interface IAuditLog {
  _id: Types.ObjectId;
  subject?: string;
  description?: string;
  entityType: string;
  entityId: string;
  performedByUserId?: Types.ObjectId;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

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

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });
auditLogSchema.index({ createdAt: 1 });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
