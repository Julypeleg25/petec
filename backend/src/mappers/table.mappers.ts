import { patientRepository } from "@repositories/patient.repository";
import { caseRepository } from "@repositories/case.repository";
import { auditRepository } from "@repositories/audit.repository";
import { userRepository } from "@repositories/user.repository";
import type { MongoFilter, SortRecord } from "@utils/types";
import type { HydratedDocument } from "mongoose";

import type { IPatient } from "@models/Patient";
import type { ICase } from "@models/Case";
import type { IAuditLog } from "@models/AuditLog";
import type { UserDocument } from "@models/User";

export interface CollectionHandler<T = any> {
    find: (filter: MongoFilter, page: number, limit: number, sortBy: string, sortOrder: "asc" | "desc") => Promise<T[]>;
    count: (filter: MongoFilter) => Promise<number>;
}

export const toSortRecord = (sortBy: string, sortOrder: "asc" | "desc"): SortRecord => ({
    [sortBy]: sortOrder === "asc" ? 1 : -1,
});

import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { systemTypesRepository } from "@repositories/systemTypes.repository";

// ... imports ...

export const COLLECTION_HANDLERS: Record<string, CollectionHandler> = {
    patients: {
        async find(filter, page, limit, sortBy, sortOrder) {
            const skip = (page - 1) * limit;
            const sort = toSortRecord(sortBy, sortOrder);
            const docs = await patientRepository.findMany(filter, { skip, limit, sort });
            return docs.map((d) => d.toObject());
        },
        count(filter) { return patientRepository.countDocuments(filter); },
    },
    // ... cases, audit_logs, users ...
    cases: {
        async find(filter, page, limit, sortBy, sortOrder) {
            const skip = (page - 1) * limit;
            const sort = toSortRecord(sortBy, sortOrder);
            const docs = await caseRepository.findMany({ ...filter, isDeleted: false }, { skip, limit, sort });
            return docs.map((d) => d.toObject());
        },
        count(filter) { return caseRepository.countDocuments({ ...filter, isDeleted: false }); },
    },
    audit_logs: {
        async find(filter, page, limit, sortBy, sortOrder) {
            const skip = (page - 1) * limit;
            const sort = toSortRecord(sortBy, sortOrder);
            const docs = await auditRepository.findMany(filter, { skip, limit, sort });
            return docs.map((d) => d.toObject());
        },
        count(filter) { return auditRepository.countDocuments(filter); },
    },
    users: {
        async find(filter, page, limit, sortBy, sortOrder) {
            const skip = (page - 1) * limit;
            const sort = toSortRecord(sortBy, sortOrder);
            const docs = await userRepository.findMany(filter, { skip, limit, sort });
            return docs.map((d) => d.toObject());
        },
        count(filter) { return userRepository.countDocuments(filter); },
    },
};

const systemHandlers: Record<string, CollectionHandler> = {};
Object.values(SYSTEM_TYPE_NAMES).forEach((typeName) => {
    systemHandlers[typeName] = {
        find: (filter, page, limit, sortBy, sortOrder) =>
            systemTypesRepository.findPaginated(typeName, filter, page, limit, sortBy, sortOrder),
        count: (filter) => systemTypesRepository.countDocuments(typeName, filter),
    };
});

export const TABLE_HANDLERS = { ...COLLECTION_HANDLERS, ...systemHandlers };
