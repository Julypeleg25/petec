import type { HydratedDocument, Types } from "mongoose";

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
