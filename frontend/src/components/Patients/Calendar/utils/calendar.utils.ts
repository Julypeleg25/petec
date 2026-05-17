import type { HolidayLookup } from "../api/calendar.hebcal";

const LOCALE_HE_IL = "he-IL";
const LOCALE_HE_CAL_HEBREW = "he-u-ca-hebrew";
const LOCALE_EN_CAL_HEBREW = "en-u-ca-hebrew";

const FORMAT_LONG = "long";
const FORMAT_NUMERIC = "numeric";
const FORMAT_NARROW = "narrow";
const FORMAT_SHORT = "short";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat(LOCALE_HE_IL, {
  month: FORMAT_LONG,
  year: FORMAT_NUMERIC,
});
const WEEKDAY_LABEL_FORMATTER = new Intl.DateTimeFormat(LOCALE_HE_IL, {
  weekday: FORMAT_NARROW,
});

const HEBREW_MONTH_FORMATTER = new Intl.DateTimeFormat(LOCALE_HE_CAL_HEBREW, {
  month: FORMAT_SHORT,
});

const HEBREW_DAY_PARTS_FORMATTER = new Intl.DateTimeFormat(LOCALE_EN_CAL_HEBREW, {
  day: FORMAT_NUMERIC,
});

const PAD_CHAR_ZERO = "0";
const DATE_SEPARATOR_DASH = "-";

const HEBREW_SPECIAL_15_NUMBER = 15;
const HEBREW_SPECIAL_15_STRING = "ט״ו";
const HEBREW_SPECIAL_16_NUMBER = 16;
const HEBREW_SPECIAL_16_STRING = "ט״ז";

const HEBREW_GERESH = "׳";
const HEBREW_GERSHAYIM = "״";
const DECIMAL_BASE = 10;
const RADIX_DECIMAL = 10;
const SINGLE_LETTER_LENGTH = 1;

const GEMATRIA_ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const GEMATRIA_TENS = ["", "י", "כ", "ל"];

const toHebrewNumeral = (num: number): string => {
  if (num === HEBREW_SPECIAL_15_NUMBER) return HEBREW_SPECIAL_15_STRING;
  if (num === HEBREW_SPECIAL_16_NUMBER) return HEBREW_SPECIAL_16_STRING;

  const tens = Math.floor(num / DECIMAL_BASE);
  const ones = num % DECIMAL_BASE;
  const letters = (GEMATRIA_TENS[tens] ?? "") + (GEMATRIA_ONES[ones] ?? "");

  if (letters.length === SINGLE_LETTER_LENGTH) return letters + HEBREW_GERESH;
  return letters.slice(PREVIOUS_MONTH_LAST_DAY, -SINGLE_LETTER_LENGTH) + HEBREW_GERSHAYIM + letters.slice(-SINGLE_LETTER_LENGTH);
};

const formatHebrewDate = (date: Date): string => {
  const dayStr = HEBREW_DAY_PARTS_FORMATTER.format(date);
  const dayNum = parseInt(dayStr, RADIX_DECIMAL);
  const month = HEBREW_MONTH_FORMATTER.format(date);
  const hebrewDay = Number.isFinite(dayNum) ? toHebrewNumeral(dayNum) : dayStr;
  return `${hebrewDay} ${month}`;
};
const FIRST_MONTH_DAY = 1;
const MONTH_INDEX_OFFSET = 1;
const DAY_PADDING_LENGTH = 2;
const PREVIOUS_MONTH_LAST_DAY = 0;
const DAYS_IN_WEEK = 7;
const WEEKDAY_REFERENCE_SUNDAY = new Date(2024, 0, 7);

export type CalendarMonthCursor = {
  year: number;
  month: number;
};

export type CalendarDateMeta = {
  holidayLabels: string[];
  specialLabels: string[];
  hebrewDateLabel: string;
  isToday: boolean;
};

export const CALENDAR_WEEKDAY_LABELS = Array.from(
  { length: DAYS_IN_WEEK },
  (_, index) =>
    WEEKDAY_LABEL_FORMATTER.format(
      new Date(
        WEEKDAY_REFERENCE_SUNDAY.getFullYear(),
        WEEKDAY_REFERENCE_SUNDAY.getMonth(),
        WEEKDAY_REFERENCE_SUNDAY.getDate() + index,
      ),
    ),
);
const CALENDAR_GRID_COLUMNS = CALENDAR_WEEKDAY_LABELS.length;

const toTwoDigits = (value: number): string =>
  String(value).padStart(DAY_PADDING_LENGTH, PAD_CHAR_ZERO);

const toLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}${DATE_SEPARATOR_DASH}${toTwoDigits(date.getMonth() + MONTH_INDEX_OFFSET)}${DATE_SEPARATOR_DASH}${toTwoDigits(
    date.getDate(),
  )}`;

export const createCurrentMonthCursor = (): CalendarMonthCursor => {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + MONTH_INDEX_OFFSET,
  };
};

export const shiftMonthCursor = (
  cursor: CalendarMonthCursor,
  delta: number,
): CalendarMonthCursor => {
  const nextDate = new Date(
    cursor.year,
    cursor.month - MONTH_INDEX_OFFSET + delta,
    FIRST_MONTH_DAY,
  );
  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth() + MONTH_INDEX_OFFSET,
  };
};

export const getMonthLabel = (year: number, month: number): string =>
  MONTH_LABEL_FORMATTER.format(
    new Date(year, month - MONTH_INDEX_OFFSET, FIRST_MONTH_DAY),
  );

export const buildMonthGrid = (year: number, month: number): Array<Date | null> => {
  const firstDayOfMonth = new Date(
    year,
    month - MONTH_INDEX_OFFSET,
    FIRST_MONTH_DAY,
  );
  const lastDayOfMonth = new Date(year, month, PREVIOUS_MONTH_LAST_DAY);
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();
  const grid: Array<Date | null> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    grid.push(null);
  }

  for (let day = FIRST_MONTH_DAY; day <= totalDays; day += 1) {
    grid.push(new Date(year, month - MONTH_INDEX_OFFSET, day));
  }

  while (grid.length % CALENDAR_GRID_COLUMNS !== 0) {
    grid.push(null);
  }

  return grid;
};

export const getDateKey = (date: Date): string => toLocalDateKey(date);

export const getCalendarDateMeta = (
  date: Date,
  holidayLookup?: HolidayLookup,
): CalendarDateMeta => {
  const dateKey = getDateKey(date);
  const todayKey = toLocalDateKey(new Date());

  const entry = holidayLookup?.get(dateKey);

  return {
    holidayLabels: entry?.holidayLabels ?? [],
    specialLabels: entry?.specialLabels ?? [],
    hebrewDateLabel: formatHebrewDate(date),
    isToday: dateKey === todayKey,
  };
};
