import { Model, UpdateQuery, HydratedDocument, Types, QueryFilter, ClientSession } from "mongoose";

export type RepositorySessionOptions = {
    session?: ClientSession;
};

export class BaseRepository<T> {
    protected readonly model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(
        data: Partial<T>,
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T>> {
        const doc = new this.model(data as T);
        await doc.save(options?.session ? { session: options.session } : undefined);
        return doc as HydratedDocument<T>;
    }

    async findById(
        id: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T> | null> {
        const query = this.model.findById(id);
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }

    async findOne(
        filter: QueryFilter<T>,
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T> | null> {
        const query = this.model.findOne(filter);
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
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
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T> | null> {
        const query = this.model.findByIdAndUpdate(id, update, {
            returnDocument: "after",
        });
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }

    async updateOne(
        filter: QueryFilter<T>,
        update: UpdateQuery<T>,
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T> | null> {
        const query = this.model.findOneAndUpdate(filter, update, {
            returnDocument: "after",
        });
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }

    async deleteById(
        id: string | Types.ObjectId,
        options?: RepositorySessionOptions,
    ): Promise<HydratedDocument<T> | null> {
        const query = this.model.findByIdAndDelete(id);
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }

    async deleteMany(
        filter: QueryFilter<T>,
        options?: RepositorySessionOptions,
    ): Promise<number> {
        const query = this.model.deleteMany(filter);
        if (options?.session) {
            query.session(options.session);
        }
        const result = await query.exec();
        return result.deletedCount ?? 0;
    }

    async exists(filter: QueryFilter<T>): Promise<boolean> {
        const doc = await this.model.exists(filter).exec();
        return doc !== null;
    }
}
