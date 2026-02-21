import { SORT_DIRECTIONS, SortOrders, SYSTEM_TYPE_NAMES, type SortOrder } from "@petec/shared";

import { auditRepository } from "@repositories/audit.repository";
import { caseRepository } from "@repositories/case.repository";
import { patientRepository } from "@repositories/patient.repository";
import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { userRepository } from "@repositories/user.repository";

import type { MongoFilter, SortRecord } from "@utils/types";
import type {
  BaseTableKey,
  CollectionHandler,
  FindManyRepo,
  SystemTypeName,
  TableKey,
  TableRow,
} from "@mappers/table.mappers.types";

const toSortRecord = (sortBy: string, sortOrder: SortOrder): SortRecord => ({
  [sortBy]: sortOrder === SortOrders.ASC ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC,
});

const toSkip = (page: number, limit: number): number => (page - 1) * limit;

const createMongoHandler = <TOut>(
  repo: FindManyRepo<TOut>,
  baseFilter: (filter: MongoFilter) => MongoFilter = (f) => f
): CollectionHandler<TOut> => ({
  async find(filter, args) {
    const { page, limit, sortBy, sortOrder } = args;
    const docs = await repo.findMany(baseFilter(filter), {
      skip: toSkip(page, limit),
      limit,
      sort: toSortRecord(sortBy, sortOrder),
    });
    return docs.map((d) => d.toObject());
  },
  count(filter) {
    return repo.countDocuments(baseFilter(filter));
  },
});

const createSystemTypeHandler = (typeName: SystemTypeName): CollectionHandler<TableRow> => ({
  find(filter, args) {
    const { page, limit, sortBy, sortOrder } = args;
    return systemTypesRepository.findPaginated(typeName, filter, page, limit, sortBy, sortOrder);
  },
  count(filter) {
    return systemTypesRepository.countDocuments(typeName, filter);
  },
});

const BASE_HANDLERS: Record<BaseTableKey, CollectionHandler<TableRow>> = {
  patients: createMongoHandler(patientRepository),
  cases: createMongoHandler(caseRepository, (filter) => ({ ...filter, isDeleted: false })),
  audit_logs: createMongoHandler(auditRepository),
  users: createMongoHandler(userRepository),
};

const SYSTEM_HANDLERS: Record<SystemTypeName, CollectionHandler<TableRow>> = Object.fromEntries(
  (Object.values(SYSTEM_TYPE_NAMES) as SystemTypeName[]).map((typeName) => [
    typeName,
    createSystemTypeHandler(typeName),
  ])
) as Record<SystemTypeName, CollectionHandler<TableRow>>;

export const TABLE_HANDLERS: Readonly<Record<TableKey, CollectionHandler<TableRow>>> = Object.freeze({
  ...BASE_HANDLERS,
  ...SYSTEM_HANDLERS,
});
