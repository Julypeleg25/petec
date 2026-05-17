import { BaseRepository } from "../base.repository.js";
import { AuditLogModel } from "../../models/auditLog/index.js";
import type { IAuditLog, AuditLogDocument } from "../../models/auditLog/index.js";
import type { Types, ClientSession } from "mongoose";

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
        session?: ClientSession,
    ): Promise<AuditLogDocument> {
        const data: Partial<IAuditLog> = { subject, description, entityType, entityId };
        if (performedByUserId !== undefined) {
            data.performedByUserId = typeof performedByUserId === "string"
                ? new (await import("mongoose")).Types.ObjectId(performedByUserId)
                : performedByUserId;
        }
        const [doc] = await this.model.create([data], { session });
        return doc as AuditLogDocument;
    };
}

export const auditRepository = new AuditRepository();
