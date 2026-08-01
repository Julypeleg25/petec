import {
  CASE_DETAIL_TIME_FILTER_OPTIONS,
  CLINICAL_TIME_ZONE,
  type CaseDetailCategoryFilter,
  type CaseDetailItem,
  type CaseDetailSortOrder,
  type CaseDetailStatusFilter,
  type CaseDetailTimeFilter,
} from "./clinicalSummary.constants";

const ENGLISH_ALIAS_IN_PARENTHESES_PATTERN =
  /\s*\([A-Za-z][A-Za-z0-9 .,+/:'-]*\)/g;
const REPEATED_WHITESPACE_PATTERN = /\s{2,}/g;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLINICAL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINICAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const getDateTimePart = (
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string => parts.find((part) => part.type === type)?.value ?? "";

export const cleanClinicalText = (value: string): string =>
  value
    .replace(ENGLISH_ALIAS_IN_PARENTHESES_PATTERN, "")
    .replace(REPEATED_WHITESPACE_PATTERN, " ")
    .trim();

export const getCaseDetailDate = (item: CaseDetailItem): string =>
  item.scheduledAt.slice(0, 10);

export const getCaseDetailTime = (item: CaseDetailItem): string =>
  item.scheduledAt.slice(11, 16);

export interface CaseDetailFilters {
  readonly category: CaseDetailCategoryFilter;
  readonly searchText: string;
  readonly sortOrder: CaseDetailSortOrder;
  readonly status: CaseDetailStatusFilter;
  readonly time: CaseDetailTimeFilter;
}

const getSearchableCaseDetailText = (item: CaseDetailItem): string =>
  [item.name, item.value, item.dosage, item.route, item.frequency, item.comment]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("he-IL");

const matchesCaseDetailTime = (
  item: CaseDetailItem,
  timeFilter: CaseDetailTimeFilter,
): boolean => {
  const selectedRange = CASE_DETAIL_TIME_FILTER_OPTIONS.find(
    ({ value }) => value === timeFilter,
  );
  if (!selectedRange || timeFilter === "all") return true;

  const hour = Number.parseInt(getCaseDetailTime(item).slice(0, 2), 10);
  return (
    Number.isFinite(hour) &&
    hour >= selectedRange.startHour &&
    hour <= selectedRange.endHour
  );
};

const matchesCaseDetailFilters = (
  item: CaseDetailItem,
  filters: CaseDetailFilters,
): boolean => {
  const normalizedSearch = filters.searchText.trim().toLocaleLowerCase("he-IL");
  return (
    (filters.status === "all" || item.status === filters.status) &&
    (filters.category === "all" || item.category === filters.category) &&
    matchesCaseDetailTime(item, filters.time) &&
    (!normalizedSearch ||
      getSearchableCaseDetailText(item).includes(normalizedSearch))
  );
};

export const filterAndSortCaseDetails = (
  items: readonly CaseDetailItem[],
  filters: CaseDetailFilters,
): CaseDetailItem[] =>
  items
    .filter((item) => matchesCaseDetailFilters(item, filters))
    .sort((left, right) => {
      const comparison = left.scheduledAt.localeCompare(right.scheduledAt);
      return filters.sortOrder === "ascending" ? comparison : -comparison;
    });

export const filterCaseDetailsByDate = (
  items: readonly CaseDetailItem[],
  selectedDate: string,
): CaseDetailItem[] =>
  items.filter((item) => getCaseDetailDate(item) === selectedDate);

export const getPageCount = (itemCount: number, pageSize: number): number =>
  Math.max(1, Math.ceil(itemCount / pageSize));

export const getPageItems = <T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): T[] => items.slice(page * pageSize, (page + 1) * pageSize);

export const formatClinicalDate = (date: string): string => {
  const match = ISO_DATE_PATTERN.exec(date);
  if (!match) return date;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export const formatClinicalDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = CLINICAL_DATE_TIME_FORMATTER.formatToParts(date);
  const day = getDateTimePart(parts, "day");
  const month = getDateTimePart(parts, "month");
  const year = getDateTimePart(parts, "year");
  const hour = getDateTimePart(parts, "hour");
  const minute = getDateTimePart(parts, "minute");

  return `${day}/${month}/${year} ${hour}:${minute}`;
};
