import type { CalendarPatientItemDTO } from "@petec/shared";
import type { CalendarDateMeta } from "../utils/calendar.utils";

export type CalendarMonthDataDay = {
  date: string;
  patients: CalendarPatientItemDTO[];
};

export type CalendarDayView = {
  date: Date;
  dateKey: string;
  meta: CalendarDateMeta;
  patients: CalendarPatientItemDTO[];
};

export type SelectedCalendarEntry = {
  dateLabel: string;
  patient: CalendarPatientItemDTO;
};

export type SelectedCalendarDay = {
  date: Date;
  dateLabel: string;
  patients: CalendarPatientItemDTO[];
};
