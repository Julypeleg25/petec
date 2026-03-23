import { BaseRepository } from "../base.repository.js";
import { AuditLogModel } from "../../models/auditLog/index.js";
import type { IAuditLog, AuditLogDocument } from "../../models/auditLog/index.js";
import type { Types } from "mongoose";

export class AuditRepository extends BaseRepository<IAuditLog> {
    constructor() {
        super(AuditLogModel);
    }

    async findByEntityId(entityType: string, entityId: string): Promise<AuditLogDocument[]> {
        return this.model
            .find({ entityType, entityId })
            .populate("performedByUserId", "email role")
            .sort({ createdAt: -1 })
            .exec();
    }

    async deleteAllByEntityId(entityType: string, entityId: string): Promise<number> {
        const result = await this.model.deleteMany({ entityType, entityId }).exec();
        return result.deletedCount ?? 0;
    };

    async log(
        subject: string,
        description: string,
        entityType: string,
        entityId: string,
        performedByUserId?: string | Types.ObjectId,
    ): Promise<AuditLogDocument> {
        const data: Partial<IAuditLog> = { subject, description, entityType, entityId };
        if (performedByUserId !== undefined) {
            data.performedByUserId = typeof performedByUserId === "string"
                ? new (await import("mongoose")).Types.ObjectId(performedByUserId)
                : performedByUserId;
        }
        return this.model.create(data);
    };
}

export const auditRepository = new AuditRepository();
