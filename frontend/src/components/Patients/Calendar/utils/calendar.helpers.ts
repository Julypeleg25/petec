import { getCalendarDateMeta, getDateKey } from "./calendar.utils";
import type { CalendarDayView, CalendarMonthDataDay } from "../types/calendar.types";
import type { HolidayLookup } from "../api/calendar.hebcal";

const DEFAULT_YEAR_RANGE_RADIUS = 10;
const START_OF_DAY_HOUR = 0;
const START_OF_DAY_MINUTE = 0;
const START_OF_DAY_SECOND = 0;
const START_OF_DAY_MILLISECOND = 0;

export const createYearOptions = (
  currentYear: number,
  radius = DEFAULT_YEAR_RANGE_RADIUS,
): number[] =>
  Array.from({ length: radius * 2 + 1 }, (_, index) => currentYear - radius + index);

export const buildDayLookup = (
  days: CalendarMonthDataDay[],
): Map<string, CalendarMonthDataDay> => new Map(days.map((day) => [day.date, day]));

export const buildCalendarDays = (
  monthGrid: Array<Date | null>,
  dayLookup: Map<string, CalendarMonthDataDay>,
  holidayLookup?: HolidayLookup,
): CalendarDayView[] =>
  monthGrid
    .filter((value): value is Date => value instanceof Date)
    .map((date) => {
      const dateKey = getDateKey(date);
      return {
        date,
        dateKey,
        meta: getCalendarDateMeta(date, holidayLookup),
        patients: dayLookup.get(dateKey)?.patients ?? [],
      };
    });



export const isPastCalendarDay = (date: Date): boolean => {
  const today = new Date();
  today.setHours(
    START_OF_DAY_HOUR,
    START_OF_DAY_MINUTE,
    START_OF_DAY_SECOND,
    START_OF_DAY_MILLISECOND,
  );
  return date < today;
};
