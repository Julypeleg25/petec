const DATE_TIME_SEPARATOR = "T";
const DATE_SEPARATOR = "-";
const DISPLAY_DATE_SEPARATOR = "/";
const DISPLAY_DATE_TIME_SEPARATOR = ", ";
const DISPLAY_TIME_SEPARATOR = ":";
const MONTH_OFFSET = 1;
const TWO_DIGIT_PAD_LENGTH = 2;
const PAD_CHAR = "0";
const DATE_PART_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toTwoDigit = (value: number | string): string =>
  String(value).padStart(TWO_DIGIT_PAD_LENGTH, PAD_CHAR);

const toDisplayNumericDate = (
  year: number | string,
  month: number | string,
  day: number | string,
): string =>
  `${Number(day)}${DISPLAY_DATE_SEPARATOR}${Number(month)}${DISPLAY_DATE_SEPARATOR}${year}`;

const toDisplayDate = (
  year: number | string,
  month: number | string,
  day: number | string,
): string =>
  `${toTwoDigit(day)}${DISPLAY_DATE_SEPARATOR}${toTwoDigit(month)}${DISPLAY_DATE_SEPARATOR}${year}`;

export const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = toTwoDigit(date.getMonth() + MONTH_OFFSET);
  const day = toTwoDigit(date.getDate());
  return toDisplayDate(year, month, day);
};

export const getFormattedDateTime = (date: Date): string => {
  const hours = toTwoDigit(date.getHours());
  const minutes = toTwoDigit(date.getMinutes());
  const seconds = toTwoDigit(date.getSeconds());
  return `${toDisplayNumericDate(
    date.getFullYear(),
    date.getMonth() + MONTH_OFFSET,
    date.getDate(),
  )}${DISPLAY_DATE_TIME_SEPARATOR}${hours}${DISPLAY_TIME_SEPARATOR}${minutes}${DISPLAY_TIME_SEPARATOR}${seconds}`;
};

const toDatePart = (value: string): string | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const [rawDatePart] = trimmedValue.split(DATE_TIME_SEPARATOR);
  if (DATE_PART_REGEX.test(rawDatePart)) {
    return rawDatePart;
  }

  const parsedDate = new Date(trimmedValue);
  if (!Number.isFinite(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getFullYear();
  const month = toTwoDigit(parsedDate.getMonth() + MONTH_OFFSET);
  const day = toTwoDigit(parsedDate.getDate());
  return `${year}${DATE_SEPARATOR}${month}${DATE_SEPARATOR}${day}`;
};

export const getFormattedDateFromDBdate = (
  date?: string | Date | null,
): string => {
  if (!date) {
    return "";
  }

  if (date instanceof Date) {
    if (!Number.isFinite(date.getTime())) {
      return "";
    }
    return getFormattedDate(date);
  }

  const datePart = toDatePart(date);
  if (!datePart) {
    return "";
  }

  const [year, month, day] = datePart.split(DATE_SEPARATOR);
  return toDisplayDate(year, month, day);
};

export const getFormattedDateTimeFromDBdate = (
  date?: string | Date | null,
): string => {
  if (!date) {
    return "";
  }

  if (date instanceof Date) {
    if (!Number.isFinite(date.getTime())) {
      return "";
    }
    return getFormattedDateTime(date);
  }

  const trimmedValue = date.trim();
  if (!trimmedValue) {
    return "";
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isFinite(parsedDate.getTime())) {
    return getFormattedDateTime(parsedDate);
  }

  const datePart = toDatePart(trimmedValue);
  if (!datePart) {
    return "";
  }

  return `${getFormattedDateFromDBdate(datePart)}${DISPLAY_DATE_TIME_SEPARATOR}00${DISPLAY_TIME_SEPARATOR}00${DISPLAY_TIME_SEPARATOR}00`;
};

export const getDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = toTwoDigit(date.getMonth() + MONTH_OFFSET);
  const day = toTwoDigit(date.getDate());
  return `${year}${DATE_SEPARATOR}${month}${DATE_SEPARATOR}${day}`;
};

export const getDateForInputFromDBTimeStamp = (timestamp: string | null): string | null => {
  if (timestamp === null) return null;
  const [datePart] = timestamp.split(DATE_TIME_SEPARATOR);
  const [year, month, day] = datePart.split(DATE_SEPARATOR);
  return `${year}${DATE_SEPARATOR}${toTwoDigit(month)}${DATE_SEPARATOR}${toTwoDigit(day)}`;
};
