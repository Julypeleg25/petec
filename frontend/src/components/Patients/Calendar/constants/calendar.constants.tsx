import type { CalendarPatientItemDTO } from "@petec/shared";
import { FaBed, FaStethoscope } from "react-icons/fa";

export const BADGE_LABELS = {
  procedure: "פרוצדורה",
  hospitalization: "אשפוז",
} as const;

export const FLAG_LABELS = {
  isAggressive: "אגרסיבי",
  isEscapePotential: "חשש בריחה",
  isAllergic: "אלרגי",
  isRiskAnesthesia: "סיכון הרדמה",
  isHeartMurmur: "אוושה",
  isAMB: "אמבולטורי",
} as const;

export type CalendarBadge = CalendarPatientItemDTO["badges"][number];

export const hasAnyFlags = (patient: CalendarPatientItemDTO): boolean =>
  Object.values(patient.flags).some(Boolean);

export const formatCalendarDateLabel = (date: Date): string =>
  date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const getPrimaryBadge = (
  patient: CalendarPatientItemDTO,
): CalendarBadge | undefined => patient.badges[0];

export const getBadgeIcon = (badge: CalendarBadge) => {
  if (badge === "procedure") {
    return <FaStethoscope aria-hidden="true" />;
  }

  return <FaBed aria-hidden="true" />;
};
