
const DATE_TIME_SEPARATOR = "T";
const DATE_SEPARATOR = "-";
const DISPLAY_DATE_SEPARATOR = "/";
const MONTH_OFFSET = 1;
const TWO_DIGIT_PAD_LENGTH = 2;
const PAD_CHAR = "0";
const DATE_PART_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toTwoDigit = (value: number | string): string =>
  String(value).padStart(TWO_DIGIT_PAD_LENGTH, PAD_CHAR);

export const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = toTwoDigit(date.getMonth() + MONTH_OFFSET);
  const day = toTwoDigit(date.getDate());
  return `${day}${DISPLAY_DATE_SEPARATOR}${month}${DISPLAY_DATE_SEPARATOR}${year}`;
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
  return `${day}${DISPLAY_DATE_SEPARATOR}${month}${DISPLAY_DATE_SEPARATOR}${year}`;
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
