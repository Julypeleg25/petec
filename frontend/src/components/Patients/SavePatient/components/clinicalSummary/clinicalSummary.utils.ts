import {
  CLINICAL_TIME_ZONE,
  type CaseDetailItem,
} from "./clinicalSummary.constants";

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

export const formatClinicalDate = (date: string): string => {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
};

export const formatSummaryWeekday = (
  date: string,
  options: Intl.DateTimeFormatOptions,
): string => new Date(`${date}T12:00:00`).toLocaleDateString("he-IL", options);

export const formatClinicalDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINICAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}`;
};
