import {
  MOBILE_TABLE_BREAKPOINT_PX,
  SEARCH_FILTER_KEYS,
} from "./patients.constants";

export type PatientCardsFilter = Record<string, string | boolean>;

export const buildPatientsArgs = (
  showOnlyWithAlerts: boolean,
  isArchive: boolean,
): string[] => [
  String(showOnlyWithAlerts),
  String(showOnlyWithAlerts),
  String(isArchive),
];

export const buildCaseSearchFilters = (
  rawValue: string,
  isArchive: boolean,
): PatientCardsFilter => {
  const filters: PatientCardsFilter = { isArchived: isArchive };
  const value = rawValue.trim();
  if (!value) {
    return filters;
  }
  filters[SEARCH_FILTER_KEYS.SEARCH] = value;
  return filters;
};

export const formatOwnerPhone = (phone?: string): string => {
  if (!phone || phone.length <= 3) {
    return "";
  }
  return `${phone.substring(0, 3)}-${phone.substring(3)}`;
};

export const getButtonClassName = (isCurrent: boolean): string =>
  isCurrent ? "btn" : "btn btn-active";

export const getInitialViewportWidth = (): number =>
  typeof window === "undefined"
    ? MOBILE_TABLE_BREAKPOINT_PX
    : window.innerWidth;
