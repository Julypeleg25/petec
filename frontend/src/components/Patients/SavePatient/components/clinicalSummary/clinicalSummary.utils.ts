import type { CaseDetailItem } from "./clinicalSummary.constants";

const ENGLISH_ALIAS_IN_PARENTHESES_PATTERN =
  /\s*\([A-Za-z][A-Za-z0-9 .,+/:'-]*\)/g;
const REPEATED_WHITESPACE_PATTERN = /\s{2,}/g;

export const cleanClinicalText = (value: string): string =>
  value
    .replace(ENGLISH_ALIAS_IN_PARENTHESES_PATTERN, "")
    .replace(REPEATED_WHITESPACE_PATTERN, " ")
    .trim();

export const getCaseDetailDate = (item: CaseDetailItem): string =>
  item.scheduledAt.slice(0, 10);

export const getCaseDetailTime = (item: CaseDetailItem): string =>
  item.scheduledAt.slice(11, 16);

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

export const formatSummaryDay = (
  date: string,
  options: Intl.DateTimeFormatOptions,
): string => new Date(`${date}T12:00:00`).toLocaleDateString("he-IL", options);
