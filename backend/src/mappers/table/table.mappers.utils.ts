import {
  SORT_DIRECTIONS,
  SortOrders,
  SYSTEM_TYPE_NAMES,
  type SystemTypeName as SharedSystemTypeName,
  type SortOrder,
} from "@petec/shared";
import { Types } from "mongoose";

import { patientRepository } from "@repositories/patient.repository";
import { caseRepository } from "@repositories/case.repository";
import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { userRepository } from "@repositories/user.repository";
import {
  toBooleanWithDefault,
  toMapperIdString,
  toNullableFiniteNumber,
  toNullableIsoDateString,
  toNullableTrimmedString,
  type MapperIdLike,
} from "@mappers/common/common.mappers.utils";
import { toAdminMedicineRowDTO } from "@mappers/system-management/medicine.admin.mapper";

import type { BaseLookup, MongoFilter, SortRecord } from "@app-types/global.types";
import type {
  CollectionHandler,
  FindManyRepo,
  PaginationArgs,
  SystemTypeName,
  TableRow,
} from "@mappers/table/table.mappers.types";
import type { IAuditLog } from "@models/AuditLog";
import type { IUser } from "@models/User";

const CASE_SEARCH_RESULT_LIMIT = 1000;
type FilterValue = MongoFilter[keyof MongoFilter];

const SEARCH_FILTER_KEYS = {
  SEARCH: "search",
  LEGACY_CASE: "masterCaseId",
} as const;

const CASE_TEXT_FILTER_KEYS = {
  SERIAL_ID: "serialId",
  PATIENT_NAME: "patientId.name",
  OWNER_PHONE: "patientId.owner.phone",
} as const;

const USER_FILTER_KEY_MAP: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  role_name: "role",
};

const AUDIT_FILTER_KEYS = {
  CREATED_AT: "created_at",
  CREATED_BY_NAME: "created_by_name",
  CASE_SERIAL_ID: "case_serial_id",
  PATIENT_NAME: "patient_name",
} as const;

type SystemTypeTableScalar = string | number | boolean | null;
type SystemTypeTableRow = Record<string, SystemTypeTableScalar>;
type NamedRefLike = { _id?: MapperIdLike; name?: string };
type LookupRefLike = MapperIdLike | NamedRefLike | null | undefined;
type SystemTypeTableDoc = {
  _id?: MapperIdLike;
  serialId?: string;
  name?: string;
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  animalTypeId?: LookupRefLike;
  categoryId?: LookupRefLike;
  measureUnitId?: LookupRefLike;
  dosageFrequencyId?: LookupRefLike;
  routeOfAdministrationId?: LookupRefLike;
  rangeMin?: number | null;
  rangeMax?: number | null;
  totalDose?: number | null;
  comments?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
};

const SYSTEM_TYPE_FIELD_MAP: Record<string, string> = {
  id: "_id",
  _id: "_id",
  name: "name",
  serial_id: "serialId",
  is_deleted: "isDeleted",
  created_at: "createdAt",
  updated_at: "updatedAt",
  animal_type_id: "animalTypeId",
  animal_type: "animalTypeId",
  category_id: "categoryId",
  medicine_category: "categoryId",
  measure_unit_id: "measureUnitId",
  measure_unit: "measureUnitId",
  dosage_frequency_id: "dosageFrequencyId",
  dosage_frequency: "dosageFrequencyId",
  route_of_administration_id: "routeOfAdministrationId",
  route_of_administration: "routeOfAdministrationId",
  range_min: "rangeMin",
  range_max: "rangeMax",
  total_dose: "totalDose",
  comments: "comments",
  vitals_type: "name",
};

const mapSystemTypeFieldName = (fieldName: string): string =>
  SYSTEM_TYPE_FIELD_MAP[fieldName] ?? fieldName;

const getSystemTypePopulateFields = (
  typeName: SharedSystemTypeName,
): string[] => {
  if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
    return [
      "categoryId",
      "measureUnitId",
      "dosageFrequencyId",
      "routeOfAdministrationId",
    ];
  }
  if (
    typeName === SYSTEM_TYPE_NAMES.RACE_TYPES ||
    typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS
  ) {
    return ["animalTypeId"];
  }
  return [];
};

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toSearchRegex = (value: string): RegExp => {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => escapeRegex(token));

  if (tokens.length === 0) {
    return /.*/i;
  }

  if (tokens.length === 1) {
    return new RegExp(tokens[0], "i");
  }

  const lookaheads = tokens.map((token) => `(?=.*${token})`).join("");
  return new RegExp(`${lookaheads}.*`, "i");
};

const toFlexibleDigitsRegex = (value: string): RegExp | null => {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const pattern = digits.split("").map(escapeRegex).join("\\D*");
  return new RegExp(pattern, "i");
};

const toFlexiblePhoneRegex = (value: string): RegExp =>
  toFlexibleDigitsRegex(value) ?? toSearchRegex(value);

const buildSerialSearchClauses = (searchTerm: string): MongoFilter[] => {
  const clauses: MongoFilter[] = [{ serialId: toSearchRegex(searchTerm) }];
  const flexibleSerialRegex = toFlexibleDigitsRegex(searchTerm);
  if (flexibleSerialRegex) {
    clauses.push({ serialId: flexibleSerialRegex });
  }
  return clauses;
};

const toStringFilterValue = (value: FilterValue): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

const removeFilterKeys = (
  filter: MongoFilter,
  keysToRemove: ReadonlyArray<string>,
): MongoFilter => {
  const removedKeys = new Set(keysToRemove);
  return Object.entries(filter).reduce<MongoFilter>((accumulator, [key, value]) => {
    if (!removedKeys.has(key)) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

const toSearchTerm = (filter: MongoFilter): string =>
  toStringFilterValue(filter[SEARCH_FILTER_KEYS.SEARCH]) ||
  toStringFilterValue(filter[SEARCH_FILTER_KEYS.LEGACY_CASE]);

export const toSortRecord = (
  sortBy: string,
  sortOrder: SortOrder,
): SortRecord => ({
  [sortBy]:
    sortOrder === SortOrders.ASC ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC,
});

export const toSkip = (page: number, limit: number): number =>
  (page - 1) * limit;

const SYSTEM_TYPE_REFERENCE_FILTER_TARGETS: Record<
  string,
  SharedSystemTypeName
> = {
  animal_type: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
  medicine_category: SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
  measure_unit: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
  dosage_frequency: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
  route_of_administration: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
};

const SYSTEM_TYPE_NUMERIC_FIELDS = new Set<string>([
  "rangeMin",
  "rangeMax",
  "totalDose",
  "minValue",
  "maxValue",
]);

const isNumericString = (value: string): boolean =>
  /^-?\d+(\.\d+)?$/.test(value.trim());

const toDateRangeFilter = (value: string): MongoFilter | null => {
  const trimmedValue = value.trim();
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);
  if (dayMatch) {
    const year = Number(dayMatch[1]);
    const month = Number(dayMatch[2]);
    const day = Number(dayMatch[3]);
    const start = new Date(Date.UTC(year, month - 1, day));
    if (
      start.getUTCFullYear() !== year ||
      start.getUTCMonth() !== month - 1 ||
      start.getUTCDate() !== day
    ) {
      return null;
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { $gte: start, $lt: end };
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(trimmedValue);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const start = new Date(Date.UTC(year, month - 1, 1));
    if (
      start.getUTCFullYear() !== year ||
      start.getUTCMonth() !== month - 1
    ) {
      return null;
    }
    const end = new Date(Date.UTC(year, month, 1));
    return { $gte: start, $lt: end };
  }

  const yearMatch = /^(\d{4})$/.exec(trimmedValue);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    return { $gte: start, $lt: end };
  }

  return null;
};

const toObjectIdStrings = (
  values: ReadonlyArray<MapperIdLike>,
): string[] => {
  const ids = new Set<string>();
  for (const value of values) {
    const id = toMapperIdString(value);
    if (id) {
      ids.add(id);
    }
  }
  return Array.from(ids);
};

const intersectObjectIdStringSets = (
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
): string[] => {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
};

const resolveSystemTypeReferenceIds = async (
  targetTypeName: SharedSystemTypeName,
  rawSearchValue: string,
): Promise<string[]> => {
  const model = systemTypesRepository.getModel(targetTypeName);
  const docs = await model
    .find({ name: toSearchRegex(rawSearchValue) })
    .select("_id")
    .limit(500)
    .lean<Array<{ _id?: MapperIdLike }>>()
    .exec();

  return toObjectIdStrings(
    docs.map((doc) => doc._id),
  );
};

const mapBasicStringFilterValue = (
  fieldName: string,
  rawValue: string,
): MongoFilter[keyof MongoFilter] => {
  if (fieldName === "createdAt" || fieldName === "updatedAt") {
    return toDateRangeFilter(rawValue) ?? toSearchRegex(rawValue);
  }
  if (fieldName === "isDeleted") {
    const boolValue = toBooleanFilterValue(rawValue);
    if (boolValue !== undefined) {
      return boolValue;
    }
  }
  if (SYSTEM_TYPE_NUMERIC_FIELDS.has(fieldName) && isNumericString(rawValue)) {
    return Number(rawValue);
  }
  return toSearchRegex(rawValue);
};

const buildSystemTypeFilters = async (
  filter: MongoFilter,
): Promise<MongoFilter> => {
  const mappedFilter: MongoFilter = {};

  for (const [rawKey, rawValue] of Object.entries(filter)) {
    const mappedKey = mapSystemTypeFieldName(rawKey);

    if (typeof rawValue !== "string") {
      mappedFilter[mappedKey] = rawValue;
      continue;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      continue;
    }

    const referenceTargetType = SYSTEM_TYPE_REFERENCE_FILTER_TARGETS[rawKey];
    if (referenceTargetType) {
      const matchingIds = await resolveSystemTypeReferenceIds(
        referenceTargetType,
        trimmedValue,
      );
      mappedFilter[mappedKey] = { $in: matchingIds };
      continue;
    }

    mappedFilter[mappedKey] = mapBasicStringFilterValue(
      mappedKey,
      trimmedValue,
    );
  }

  return mappedFilter;
};

const hasNamedRef = (value: LookupRefLike): value is NamedRefLike =>
  typeof value === "object" &&
  value !== null &&
  "name" in value;

const toRefId = (value: LookupRefLike): string => {
  if (value == null) {
    return "";
  }
  if (hasNamedRef(value)) {
    return toMapperIdString(value._id);
  }
  return toMapperIdString(value);
};

const toNullableRefId = (value: LookupRefLike): string | null => {
  const id = toRefId(value);
  return id.length > 0 ? id : null;
};

const toRefText = (value: LookupRefLike): string | null => {
  if (hasNamedRef(value) && typeof value.name === "string") {
    return toNullableTrimmedString(value.name);
  }
  return null;
};

const mapSystemTypeDocToRow = (
  typeName: SharedSystemTypeName,
  doc: BaseLookup,
): SystemTypeTableRow => {
  const typedDoc = doc as SystemTypeTableDoc;
  const id = toMapperIdString(typedDoc._id);
  if (!id) {
    throw new Error(`System type "${typeName}" row is missing _id`);
  }
  const baseRow: SystemTypeTableRow = {
    id,
    name: toNullableTrimmedString(typedDoc.name),
    serial_id: toNullableTrimmedString(typedDoc.serialId),
    is_deleted: toBooleanWithDefault(typedDoc.isDeleted, false),
    created_at: toNullableIsoDateString(typedDoc.createdAt),
    updated_at: toNullableIsoDateString(typedDoc.updatedAt),
  };

  if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
    return toAdminMedicineRowDTO(typedDoc);
  }

  if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
    return {
      ...baseRow,
      animal_type_id: toNullableRefId(typedDoc.animalTypeId),
      animal_type: toRefText(typedDoc.animalTypeId),
      vitals_type: toNullableTrimmedString(typedDoc.name),
      range_min: toNullableFiniteNumber(typedDoc.minValue),
      range_max: toNullableFiniteNumber(typedDoc.maxValue),
      unit: toNullableTrimmedString(typedDoc.unit ?? undefined),
    };
  }

  if (typeName === SYSTEM_TYPE_NAMES.RACE_TYPES) {
    return {
      ...baseRow,
      animal_type_id: toNullableRefId(typedDoc.animalTypeId),
      animal_type: toRefText(typedDoc.animalTypeId),
    };
  }

  return baseRow;
};

const toBooleanFilterValue = (value: FilterValue): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }
  return undefined;
};

export const buildUsersFilter = (filter: MongoFilter): MongoFilter => {
  const andClauses: MongoFilter[] = [{ isDeleted: { $ne: true } }];

  for (const [rawKey, rawValue] of Object.entries(filter)) {
    const mappedKey = USER_FILTER_KEY_MAP[rawKey] ?? rawKey;

    if (typeof rawValue !== "string") {
      andClauses.push({ [mappedKey]: rawValue });
      continue;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      continue;
    }

    if (mappedKey === "createdAt" || mappedKey === "updatedAt") {
      andClauses.push({
        [mappedKey]:
          toDateRangeFilter(trimmedValue) ?? toSearchRegex(trimmedValue),
      });
      continue;
    }

    andClauses.push({ [mappedKey]: toSearchRegex(trimmedValue) });
  }

  if (andClauses.length === 0) {
    return {};
  }
  if (andClauses.length === 1) {
    return andClauses[0];
  }
  return { $and: andClauses };
};

const resolveCaseIdsBySerial = async (rawValue: string): Promise<string[]> => {
  const docs = await caseRepository.findManyLean(
    { serialId: toSearchRegex(rawValue), isDeleted: false },
    { select: "_id", limit: CASE_SEARCH_RESULT_LIMIT },
  );
  return toObjectIdStrings(docs.map((doc) => doc._id));
};

const resolveUserIdsByNameOrEmail = async (
  rawValue: string,
): Promise<string[]> => {
  const searchRegex = toSearchRegex(rawValue);
  const docs = await userRepository.findManyLean(
    {
      $or: [{ username: searchRegex }, { email: searchRegex }],
    },
    { select: "_id", limit: CASE_SEARCH_RESULT_LIMIT },
  );
  return toObjectIdStrings(docs.map((doc) => doc._id));
};

const resolveCaseIdsByPatientName = async (
  rawValue: string,
): Promise<string[]> => {
  const patientIds = await patientRepository.searchCasePatientIds(
    rawValue,
    CASE_SEARCH_RESULT_LIMIT,
  );
  if (patientIds.length === 0) {
    return [];
  }
  const docs = await caseRepository.findManyLean(
    { patientId: { $in: patientIds }, isDeleted: false },
    { select: "_id", limit: CASE_SEARCH_RESULT_LIMIT },
  );
  return toObjectIdStrings(docs.map((doc) => doc._id));
};

export const buildAuditLogsFilter = async (
  filter: MongoFilter,
): Promise<MongoFilter> => {
  const andClauses: MongoFilter[] = [];

  for (const [key, rawValue] of Object.entries(filter)) {
    if (typeof rawValue !== "string") {
      andClauses.push({ [key]: rawValue });
      continue;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      continue;
    }

    if (key === AUDIT_FILTER_KEYS.CREATED_AT) {
      const dateFilter = toDateRangeFilter(trimmedValue);
      if (dateFilter) {
        andClauses.push({ createdAt: dateFilter });
      }
      continue;
    }

    if (key === AUDIT_FILTER_KEYS.CASE_SERIAL_ID) {
      const caseIds = await resolveCaseIdsBySerial(trimmedValue);
      andClauses.push({ entityType: "Case" });
      andClauses.push({ entityId: { $in: caseIds } });
      continue;
    }

    if (key === AUDIT_FILTER_KEYS.CREATED_BY_NAME) {
      const userIds = await resolveUserIdsByNameOrEmail(trimmedValue);
      andClauses.push({ performedByUserId: { $in: userIds } });
      continue;
    }

    if (key === AUDIT_FILTER_KEYS.PATIENT_NAME) {
      const caseIds = await resolveCaseIdsByPatientName(trimmedValue);
      andClauses.push({ entityType: "Case" });
      andClauses.push({ entityId: { $in: caseIds } });
      continue;
    }

    andClauses.push({ [key]: toSearchRegex(trimmedValue) });
  }

  if (andClauses.length === 0) {
    return {};
  }
  if (andClauses.length === 1) {
    return andClauses[0];
  }
  return { $and: andClauses };
};

export const buildPatientCardsFilter = (filter: MongoFilter): MongoFilter => {
  const searchTerm = toSearchTerm(filter);
  const cleanFilter = removeFilterKeys(filter, [
    SEARCH_FILTER_KEYS.SEARCH,
    SEARCH_FILTER_KEYS.LEGACY_CASE,
  ]);
  if (!searchTerm) {
    return cleanFilter;
  }

  const searchRegex = toSearchRegex(searchTerm);
  const phoneRegex = toFlexiblePhoneRegex(searchTerm);
  return {
    ...cleanFilter,
    $or: [
      ...buildSerialSearchClauses(searchTerm),
      { name: searchRegex },
      { "owner.name": searchRegex },
      { "owner.phone": phoneRegex },
    ],
  };
};

type BuildCasesFilterOptions = {
  isProcedure?: boolean;
};

export const buildCasesFilter = async (
  filter: MongoFilter,
  options: BuildCasesFilterOptions = {},
): Promise<MongoFilter> => {
  const searchTerm = toSearchTerm(filter);
  const serialColumnSearch = toStringFilterValue(
    filter[CASE_TEXT_FILTER_KEYS.SERIAL_ID],
  );
  const patientNameColumnSearch = toStringFilterValue(
    filter[CASE_TEXT_FILTER_KEYS.PATIENT_NAME],
  );
  const ownerPhoneColumnSearch = toStringFilterValue(
    filter[CASE_TEXT_FILTER_KEYS.OWNER_PHONE],
  );
  const cleanFilter = removeFilterKeys(filter, [
    SEARCH_FILTER_KEYS.SEARCH,
    SEARCH_FILTER_KEYS.LEGACY_CASE,
    CASE_TEXT_FILTER_KEYS.SERIAL_ID,
    CASE_TEXT_FILTER_KEYS.PATIENT_NAME,
    CASE_TEXT_FILTER_KEYS.OWNER_PHONE,
  ]);
  const { isArchived: rawIsArchivedFilter, ...restFilter } = cleanFilter;
  const isArchivedFilterValue = toBooleanFilterValue(rawIsArchivedFilter);
  const baseFilter: MongoFilter = {
    ...restFilter,
    isDeleted: false,
    isArchived: isArchivedFilterValue ?? false,
  };

  if (typeof options.isProcedure === "boolean") {
    baseFilter["flags.isProcedure"] = options.isProcedure
      ? true
      : { $ne: true };
  }

  if (serialColumnSearch) {
    baseFilter.serialId = toSearchRegex(serialColumnSearch);
  }

  let patientIdsFromColumns: string[] | null = null;
  if (patientNameColumnSearch) {
    const matchingPatientsByName = await patientRepository.searchByName(
      patientNameColumnSearch,
      CASE_SEARCH_RESULT_LIMIT,
    );
    patientIdsFromColumns = toObjectIdStrings(
      matchingPatientsByName.map((patient) => patient._id),
    );
  }
  if (ownerPhoneColumnSearch) {
    const matchingPatientsByPhone = await patientRepository.searchByOwnerPhone(
      ownerPhoneColumnSearch,
      CASE_SEARCH_RESULT_LIMIT,
    );
    const phoneMatchedIds = toObjectIdStrings(
      matchingPatientsByPhone.map((patient) => patient._id),
    );
    patientIdsFromColumns =
      patientIdsFromColumns === null
        ? phoneMatchedIds
        : intersectObjectIdStringSets(patientIdsFromColumns, phoneMatchedIds);
  }
  if (patientIdsFromColumns !== null) {
    baseFilter.patientId = { $in: patientIdsFromColumns };
  }

  if (!searchTerm) {
    return baseFilter;
  }

  const matchingPatientIds = await patientRepository.searchCasePatientIds(
    searchTerm,
    CASE_SEARCH_RESULT_LIMIT,
  );
  const searchClauses: MongoFilter[] = [
    ...buildSerialSearchClauses(searchTerm),
  ];

  if (Types.ObjectId.isValid(searchTerm)) {
    searchClauses.push({ masterCaseId: new Types.ObjectId(searchTerm) });
  }

  if (matchingPatientIds.length > 0) {
    searchClauses.push({ patientId: { $in: matchingPatientIds } });
  }

  return {
    ...baseFilter,
    $or: searchClauses,
  };
};

export const createMongoHandler = <TOut, TMapped = TOut>(
  repo: FindManyRepo<TOut>,
  baseFilter: (filter: MongoFilter) => MongoFilter = (f) => f,
  mapper: (doc: TOut) => TMapped,
  populateOptions?: string | string[],
): CollectionHandler<TMapped> => ({
  async find(filter: MongoFilter, args: PaginationArgs) {
    const { page, limit, sortBy, sortOrder } = args;
    const findOpts: {
      skip: number;
      limit: number;
      sort: SortRecord;
      populate?: string | string[];
    } = {
      skip: toSkip(page, limit),
      limit,
      sort: toSortRecord(sortBy, sortOrder),
    };
    if (populateOptions) {
      findOpts.populate = populateOptions;
    }
    const docs = await repo.findManyLean(baseFilter(filter), findOpts);
    return docs.map((doc) => mapper(doc));
  },
  count(filter: MongoFilter) {
    return repo.countDocuments(baseFilter(filter));
  },
});

export const createSystemTypeHandler = (
  typeName: SystemTypeName,
): CollectionHandler<TableRow> => ({
  async find(filter: MongoFilter, args: PaginationArgs) {
    const { page, limit, sortBy, sortOrder } = args;
    const populate = getSystemTypePopulateFields(typeName);
    const mappedFilter = await buildSystemTypeFilters(filter);
    const docs = await systemTypesRepository.findPaginated(
      typeName,
      mappedFilter,
      page,
      limit,
      mapSystemTypeFieldName(sortBy),
      sortOrder,
      populate.length > 0 ? populate : undefined,
    );
    return docs.map((doc) => mapSystemTypeDocToRow(typeName, doc));
  },
  async count(filter: MongoFilter) {
    const mappedFilter = await buildSystemTypeFilters(filter);
    return systemTypesRepository.countDocuments(
      typeName,
      mappedFilter,
    );
  },
});

export type AuditUserRef = Partial<Pick<IUser, "username" | "email">>;
export type AuditLogLean = Partial<IAuditLog> & {
  _id?: string | { toString(): string };
  entityType?: string;
  entityId?: string;
  subject?: string;
  description?: string;
  createdAt?: Date | string;
  performedByUserId?: string | { toString(): string } | AuditUserRef;
};

export const toCreatedByName = (
  value: AuditLogLean["performedByUserId"],
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (
    "toString" in value &&
    typeof value.toString === "function" &&
    !("username" in value)
  ) {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    if ("username" in value && typeof value.username === "string") {
      return value.username;
    }
    if ("email" in value && typeof value.email === "string") {
      return value.email;
    }
  }
  return "";
};

export const SYSTEM_TYPE_NAMES_LIST = Object.values(
  SYSTEM_TYPE_NAMES,
) as SystemTypeName[];
