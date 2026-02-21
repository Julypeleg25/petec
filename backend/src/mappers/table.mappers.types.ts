import { SYSTEM_TYPE_NAMES, type SortOrder } from "@petec/shared";
import type { MongoFilter, SortRecord } from "@utils/types";

export type TableRow = object;

export interface PaginationArgs {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface CollectionHandler<TDoc> {
  find: (filter: MongoFilter, args: PaginationArgs) => Promise<ReadonlyArray<TDoc>>;
  count: (filter: MongoFilter) => Promise<number>;
}

export type MongooseDocLike<T> = { toObject(): T };

export type FindManyRepo<TOut> = {
  findMany: (
    filter: MongoFilter,
    opts: { skip: number; limit: number; sort: SortRecord }
  ) => Promise<ReadonlyArray<MongooseDocLike<TOut>>>;
  countDocuments: (filter: MongoFilter) => Promise<number>;
};

export type SystemTypeName = (typeof SYSTEM_TYPE_NAMES)[keyof typeof SYSTEM_TYPE_NAMES];

export type BaseTableKey = "patients" | "cases" | "audit_logs" | "users";
export type TableKey = BaseTableKey | SystemTypeName;
