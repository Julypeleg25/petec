import { SYSTEM_TYPE_NAMES_VALUES } from "./systemTypes.constants.js";

export const BASE_TABLE_NAMES = [
  "patients",
  "cases",
  "auditLogs",
  "users",
] as const;

export const TABLE_ALLOW_LIST = [
  ...BASE_TABLE_NAMES,
  ...SYSTEM_TYPE_NAMES_VALUES,
] as const;

export const PATIENT_CARD_TABLE_NAMES = [
  BASE_TABLE_NAMES[0],
  BASE_TABLE_NAMES[1],
] as const;

export const SortOrders = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const SORT_ORDER_VALUES = [SortOrders.ASC, SortOrders.DESC] as const;

export const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
} as const;

export const TABLE_DEFAULT_SORT_BY = "createdAt";

export const TABLE_SEARCH_FILTER_KEYS = {
  SEARCH: "search",
  MASTER_CASE_ID: "masterCaseId",
  HAS_ALERTS: "hasAlerts",
  PROCEDURE_DATE_IS_TODAY: "procedureDateIsToday",
} as const;

export const TABLE_QUERY_KEYS = {
  PATIENTS: "patients",
  CASES: "cases",
  PROCEDURES: "procedures",
} as const;

export const TABLE_SORT_FIELDS = {
  CREATED_AT: "created_at",
  CREATED_BY_NAME: "created_by_name",
  CASE_SERIAL_ID: "case_serial_id",
  PATIENT_NAME: "patient_name",
} as const;
