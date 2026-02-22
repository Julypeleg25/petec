import { Model, HydratedDocument, Types } from "mongoose";

import { SYSTEM_TYPE_MODEL_MAP } from "@models/Lookups";
import type { SystemTypeName } from "@petec/shared";
import type { BaseLookup, MongoFilter } from "@utils/types";

export class SystemTypesRepository {
    getModel(typeName: SystemTypeName): Model<BaseLookup> {
        const model = SYSTEM_TYPE_MODEL_MAP[typeName];
        if (!model) {
            throw new Error(`Unknown system type: ${typeName}`);
        }
        return model;
    };

    async findActive(typeName: SystemTypeName): Promise<HydratedDocument<BaseLookup>[]> {
        const model = this.getModel(typeName);
        return model.find({ isActive: true }).sort({ name: 1 }).exec();
    };

    async findAll(typeName: SystemTypeName): Promise<HydratedDocument<BaseLookup>[]> {
        const model = this.getModel(typeName);
        return model.find().sort({ name: 1 }).exec();
    };

    async findById(typeName: SystemTypeName, id: string | Types.ObjectId): Promise<HydratedDocument<BaseLookup> | null> {
        const model = this.getModel(typeName);
        return model.findById(id).exec();
    };

    async create(typeName: SystemTypeName, data: Partial<BaseLookup>): Promise<HydratedDocument<BaseLookup>> {
        const model = this.getModel(typeName);
        return model.create(data);
    };

    async update(typeName: SystemTypeName, id: string | Types.ObjectId, data: Partial<BaseLookup>): Promise<HydratedDocument<BaseLookup> | null> {
        const model = this.getModel(typeName);
        return model.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    };

    async remove(typeName: SystemTypeName, id: string | Types.ObjectId): Promise<HydratedDocument<BaseLookup> | null> {
        const model = this.getModel(typeName);
        return model.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).exec();
    };

    async hardDelete(typeName: SystemTypeName, id: string | Types.ObjectId): Promise<HydratedDocument<BaseLookup> | null> {
        const model = this.getModel(typeName);
        return model.findByIdAndDelete(id).exec();
    };

    async findByAnimalTypeId(
        typeName: SystemTypeName,
        animalTypeId: string | Types.ObjectId,
    ): Promise<HydratedDocument<BaseLookup>[]> {
        const model = this.getModel(typeName);
        return model.find({ animalTypeId, isActive: true }).sort({ name: 1 }).exec();
    };

    async countDocuments(typeName: SystemTypeName, filter: MongoFilter = {}): Promise<number> {
        const model = this.getModel(typeName);
        return model.countDocuments(filter).exec();
    };

    async findPaginated(
        typeName: SystemTypeName,
        filter: MongoFilter,
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: "asc" | "desc",
    ): Promise<BaseLookup[]> {
        const model = this.getModel(typeName);
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === "asc" ? 1 : -1;

        const docs = await model
            .find(filter)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        return docs as unknown as BaseLookup[];
    };
}

export const systemTypesRepository = new SystemTypesRepository();
