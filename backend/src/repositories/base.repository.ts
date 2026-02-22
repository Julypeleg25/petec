import { Model, UpdateQuery, QueryOptions, HydratedDocument, Types } from "mongoose";

type Filter<T> = Record<string, unknown> & Partial<T>;

export class BaseRepository<T> {
    protected readonly model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T> | Record<string, unknown>): Promise<HydratedDocument<T>> {
        return this.model.create(data as Partial<T>);
    }

    async findById(id: string | Types.ObjectId): Promise<HydratedDocument<T> | null> {
        return this.model.findById(id).exec();
    }

    async findOne(filter: Filter<T>): Promise<HydratedDocument<T> | null> {
        return this.model.findOne(filter).exec();
    }

    async findMany(
        filter: Filter<T> | Record<string, unknown> = {},
        options: {
            sort?: Record<string, 1 | -1>;
            skip?: number;
            limit?: number;
            select?: string;
            populate?: string | string[];
        } = {},
    ): Promise<HydratedDocument<T>[]> {
        let query = this.model.find(filter);

        if (options.sort) query = query.sort(options.sort);
        if (options.skip !== undefined) query = query.skip(options.skip);
        if (options.limit !== undefined) query = query.limit(options.limit);
        if (options.select) query = query.select(options.select);
        if (options.populate) {
            const fields = Array.isArray(options.populate) ? options.populate : [options.populate];
            for (const field of fields) {
                query = query.populate(field);
            }
        }

        return query.exec();
    }

    async countDocuments(filter: Filter<T> | Record<string, unknown> = {}): Promise<number> {
        return this.model.countDocuments(filter).exec();
    }

    async updateById(
        id: string | Types.ObjectId,
        update: UpdateQuery<T> | Record<string, unknown>,
        options?: QueryOptions<T>,
    ): Promise<HydratedDocument<T> | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
    }

    async updateOne(
        filter: Filter<T>,
        update: UpdateQuery<T>,
        options?: QueryOptions<T>,
    ): Promise<HydratedDocument<T> | null> {
        return this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
    }

    async deleteById(id: string | Types.ObjectId): Promise<HydratedDocument<T> | null> {
        return this.model.findByIdAndDelete(id).exec();
    }

    async deleteMany(filter: Filter<T> | Record<string, unknown>): Promise<number> {
        const result = await this.model.deleteMany(filter).exec();
        return result.deletedCount ?? 0;
    }

    async exists(filter: Filter<T>): Promise<boolean> {
        const doc = await this.model.exists(filter).exec();
        return doc !== null;
    }
}
