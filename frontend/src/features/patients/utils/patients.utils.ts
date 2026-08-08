import { TABLE_SEARCH_FILTER_KEYS } from "@petec/shared";

export type PatientCardsFilter = Record<string, string | boolean>;

export const buildCaseSearchFilters = (
  rawValue: string,
  isArchive: boolean,
  hasAlerts = false,
): PatientCardsFilter => {
  const filters: PatientCardsFilter = { isArchived: isArchive };
  const value = rawValue.trim();

  if (value) {
    filters[TABLE_SEARCH_FILTER_KEYS.SEARCH] = value;
  }

  if (hasAlerts) {
    filters[TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS] = true;
  }

  return filters;
};

export const buildProcedureSearchFilters = (
  rawValue: string,
  isArchive: boolean,
  hasAlerts = false,
): PatientCardsFilter => {
  const filters = buildCaseSearchFilters(rawValue, isArchive, hasAlerts);

  if (!isArchive) {
    filters[TABLE_SEARCH_FILTER_KEYS.PROCEDURE_DATE_IS_TODAY] = true;
  }

  return filters;
};

export const formatOwnerPhone = (phone?: string): string => {
  if (!phone || phone.length <= 3) {
    return "";
  }
  return `${phone.substring(0, 3)}-${phone.substring(3)}`;
};

export const getInitialViewportWidth = (): number =>
  typeof window === "undefined" ? 0 : window.innerWidth;

export const getCaseSerialPrefix = (serialId?: string | null): string => {
  if (!serialId) {
    return "";
  }

  const normalized = serialId.trim();
  if (normalized.length === 0) {
    return "";
  }

  const [prefix] = normalized.split("-");
  return prefix && prefix.length > 0 ? prefix : normalized;
};
