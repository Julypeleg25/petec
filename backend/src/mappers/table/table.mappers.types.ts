import { BASE_TABLE_NAMES, type SortOrder, type SystemTypeName } from "@petec/shared";
import type { MongoFilter, SortRecord } from "@app-types/global.types";
import type { MapperReferenceId } from "@mappers/common/common.mappers.utils";

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

export type BaseTableKey = (typeof BASE_TABLE_NAMES)[number];
export type TableKey = BaseTableKey | SystemTypeName;

export type FilterValue = MongoFilter[keyof MongoFilter];
export type SystemTypeTableScalar = string | number | boolean | null;
export type SystemTypeTableRow = Record<string, SystemTypeTableScalar>;
export type NamedReference = { _id?: MapperReferenceId; name?: string };
export type LookupReference = MapperReferenceId | NamedReference | null | undefined;
export type SystemTypeTableDoc = {
  _id?: MapperReferenceId;
  serialId?: string;
  name?: string;
  vitalsType?: string;
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  animalTypeId?: LookupReference;
  categoryId?: LookupReference;
  measureUnitTypeId?: LookupReference;
  dosageFrequencyId?: LookupReference;
  routeOfAdministrationId?: LookupReference;
  rangeMin?: number | null;
  rangeMax?: number | null;
  totalDose?: number | null;
  comments?: string | null;
  unit?: string | null;
};
