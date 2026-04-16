import { Model, UpdateQuery, QueryOptions, HydratedDocument, Types, QueryFilter, ClientSession, CreateOptions } from "mongoose";

export class BaseRepository<T> {
    protected readonly model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T>, options?: any): Promise<HydratedDocument<T>> {
        const [doc] = await this.model.create([data], options);
        return doc as HydratedDocument<T>;
    }

    async findById(id: string | Types.ObjectId): Promise<HydratedDocument<T> | null> {
        return this.model.findById(id).exec();
    }

    async findOne(filter: QueryFilter<T>): Promise<HydratedDocument<T> | null> {
        return this.model.findOne(filter).exec();
    }

    async findMany(
        filter: QueryFilter<T> = {} as QueryFilter<T>,
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

    async findManyLean(
        filter: QueryFilter<T> = {} as QueryFilter<T>,
        options: {
            sort?: Record<string, 1 | -1>;
            skip?: number;
            limit?: number;
            select?: string;
            populate?: string | string[];
        } = {},
    ): Promise<T[]> {
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

        return query.lean<T[]>().exec();
    }

    async countDocuments(filter: QueryFilter<T> = {} as QueryFilter<T>): Promise<number> {
        return this.model.countDocuments(filter).exec();
    }

    async updateById(
        id: string | Types.ObjectId,
        update: UpdateQuery<T>,
        options?: QueryOptions<T>,
    ): Promise<HydratedDocument<T> | null> {
        return this.model
            .findByIdAndUpdate(id, update, { ...options, returnDocument: "after" })
            .exec();
    }

    async updateOne(
        filter: QueryFilter<T>,
        update: UpdateQuery<T>,
        options?: QueryOptions<T>,
    ): Promise<HydratedDocument<T> | null> {
        return this.model
            .findOneAndUpdate(filter, update, { ...options, returnDocument: "after" })
            .exec();
    }

    async deleteById(id: string | Types.ObjectId, options?: QueryOptions<T>): Promise<HydratedDocument<T> | null> {
        return this.model.findByIdAndDelete(id, options).exec();
    }

    async deleteMany(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<number> {
        const result = await this.model.deleteMany(filter, options).exec();
        return result.deletedCount ?? 0;
    }

    async exists(filter: QueryFilter<T>): Promise<boolean> {
        const doc = await this.model.exists(filter).exec();
        return doc !== null;
    }
}
