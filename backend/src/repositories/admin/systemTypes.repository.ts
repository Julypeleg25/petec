import { Model, HydratedDocument, Types } from "mongoose";

import { SYSTEM_TYPE_MODEL_MAP } from "../../models/lookups/index.js";
import {
  SORT_DIRECTIONS,
  SortOrders,
  type SortOrder,
  type SystemTypeName,
} from "@petec/shared";
import type { BaseLookup, MongoFilter } from "../../types/global.types.js";
import { escapeRegex } from "../../mappers/table/table.mappers.utils.js";

const NOT_DELETED_FILTER: MongoFilter = {
  isDeleted: { $ne: true },
};

const toExactNameRegex = (value: string): RegExp =>
  new RegExp(`^${escapeRegex(value.trim())}$`, "i");

const isEmptyFilter = (filter: MongoFilter): boolean =>
  Object.keys(filter).length === 0;

const withNotDeletedFilter = (filter: MongoFilter = {}): MongoFilter => {
  if (isEmptyFilter(filter)) {
    return { ...NOT_DELETED_FILTER };
  }
  return { $and: [{ ...NOT_DELETED_FILTER }, filter] };
};

export class SystemTypesRepository {
  getModel(typeName: SystemTypeName): Model<BaseLookup> {
    const model = SYSTEM_TYPE_MODEL_MAP[typeName];
    if (!model) {
      throw new Error(`Unknown system type: ${typeName}`);
    }
    return model;
  }

  async findActive(
    typeName: SystemTypeName,
  ): Promise<HydratedDocument<BaseLookup>[]> {
    const model = this.getModel(typeName);
    return model.find(withNotDeletedFilter()).sort({ name: 1 }).exec();
  }

  async findAll(
    typeName: SystemTypeName,
  ): Promise<HydratedDocument<BaseLookup>[]> {
    const model = this.getModel(typeName);
    return model.find(withNotDeletedFilter()).sort({ name: 1 }).exec();
  }

  async findById(
    typeName: SystemTypeName,
    id: string | Types.ObjectId,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model.findOne(withNotDeletedFilter({ _id: id })).exec();
  }

  async findByNameIncludingDeleted(
    typeName: SystemTypeName,
    name: string,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model.findOne({ name: toExactNameRegex(name) }).exec();
  }

  async findByNameIncludingDeletedExceptId(
    typeName: SystemTypeName,
    name: string,
    idToExclude: string | Types.ObjectId,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model
      .findOne({
        _id: { $ne: idToExclude },
        name: toExactNameRegex(name),
      })
      .exec();
  }

  async create(
    typeName: SystemTypeName,
    data: Partial<BaseLookup>,
  ): Promise<HydratedDocument<BaseLookup>> {
    const model = this.getModel(typeName);
    return model.create(data);
  }

  async update(
    typeName: SystemTypeName,
    id: string | Types.ObjectId,
    data: Partial<BaseLookup>,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model
      .findOneAndUpdate(
        withNotDeletedFilter({ _id: id }),
        { $set: data },
        { returnDocument: "after" },
      )
      .exec();
  }

  async remove(
    typeName: SystemTypeName,
    id: string | Types.ObjectId,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model
      .findOneAndUpdate(
        withNotDeletedFilter({ _id: id }),
        { $set: { isDeleted: true } },
        { returnDocument: "after" },
      )
      .exec();
  }

  async hardDelete(
    typeName: SystemTypeName,
    id: string | Types.ObjectId,
  ): Promise<HydratedDocument<BaseLookup> | null> {
    const model = this.getModel(typeName);
    return model.findByIdAndDelete(id).exec();
  }

  async findByAnimalTypeId(
    typeName: SystemTypeName,
    animalTypeId: string | Types.ObjectId,
  ): Promise<HydratedDocument<BaseLookup>[]> {
    const model = this.getModel(typeName);
    return model
      .find(withNotDeletedFilter({ animalTypeId }))
      .sort({ name: 1 })
      .exec();
  }

  async countDocuments(
    typeName: SystemTypeName,
    filter: MongoFilter = {},
  ): Promise<number> {
    const model = this.getModel(typeName);
    return model.countDocuments(withNotDeletedFilter(filter)).exec();
  }

  async findPaginated(
    typeName: SystemTypeName,
    filter: MongoFilter,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: SortOrder,
    populate?: string | string[],
  ): Promise<BaseLookup[]> {
    const model = this.getModel(typeName);
    const skip = (page - 1) * limit;
    const sortDirection =
      sortOrder === SortOrders.ASC ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC;
    let query = model
      .find(withNotDeletedFilter(filter))
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit);

    if (populate) {
      const populateFields = Array.isArray(populate) ? populate : [populate];
      for (const field of populateFields) {
        query = query.populate(field);
      }
    }

    return query.lean<BaseLookup[]>().exec();
  }
}

export const systemTypesRepository = new SystemTypesRepository();
