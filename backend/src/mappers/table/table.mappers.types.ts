import { SYSTEM_TYPE_NAMES, type SortOrder } from "@petec/shared";
import type { MongoFilter, SortRecord } from "@app-types/global.types";

export type TableScalar = string | number | boolean | null | undefined;
export type TableValue = TableScalar | TableRow;
export type TableRow = { [key: string]: TableValue };

export interface PaginationArgs {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface CollectionHandler<TDoc> {
  find: (
    filter: MongoFilter,
    args: PaginationArgs,
  ) => Promise<ReadonlyArray<TDoc>>;
  count: (filter: MongoFilter) => Promise<number>;
}

export type FindManyRepo<TOut> = {
  findManyLean: (
    filter: MongoFilter,
    opts: {
      skip: number;
      limit: number;
      sort: SortRecord;
      populate?: string | string[];
    },
  ) => Promise<ReadonlyArray<TOut>>;
  countDocuments: (filter: MongoFilter) => Promise<number>;
};

export type SystemTypeName =
  (typeof SYSTEM_TYPE_NAMES)[keyof typeof SYSTEM_TYPE_NAMES];

export type BaseTableKey = "patients" | "cases" | "audit_logs" | "users";
export type TableKey = BaseTableKey | SystemTypeName;
