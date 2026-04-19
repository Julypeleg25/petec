import type {
  CalendarDayDTO,
  CalendarMonthResponseDTO,
  CalendarPatientBadgeDTO,
  CalendarPatientItemDTO,
} from "@petec/shared";
import type { ICase } from "../../../models/case/index.js";
import type { IPatient } from "../../../models/patient/index.js";
import {
  toDateInputString,
  toMapperIdString,
  toNormalizedDate,
} from "../../../mappers/common/common.mappers.utils.js";
import { toPatientPhotoUrl } from "../../../utils/patientPhoto.utils.js";

type CalendarCaseGridRow = Pick<ICase["caseDetailsGrid"][number], "date" | "dateTime">;

type CalendarPopulatedPatient = Partial<
  Pick<IPatient, "_id" | "name" | "owner" | "photoName" | "updatedAt">
>;

export type CalendarCaseSource = Pick<
  ICase,
  | "_id"
  | "serialId"
  | "masterCaseId"
  | "admission"
  | "flags"
  | "dates"
  | "caseDetailsGrid"
> & {
  patientId?: ICase["patientId"] | CalendarPopulatedPatient;
  caseDetailsGrid?: CalendarCaseGridRow[];
};

const BADGE_ORDER: ReadonlyArray<CalendarPatientBadgeDTO> = [
  "procedure",
  "hospitalization",
];

const toMonthPrefix = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, "0")}`;

const isMonthDateKey = (
  dateKey: string | undefined,
  monthPrefix: string,
): dateKey is string =>
  typeof dateKey === "string" && dateKey.startsWith(`${monthPrefix}-`);

const isPopulatedPatient = (
  value?: ICase["patientId"] | CalendarPopulatedPatient,
): value is CalendarPopulatedPatient =>
  typeof value === "object" &&
  value !== null &&
  ("name" in value || "owner" in value || "photoName" in value);

const toSortedBadges = (
  badges: ReadonlySet<CalendarPatientBadgeDTO>,
): CalendarPatientBadgeDTO[] =>
  BADGE_ORDER.filter((badge) => badges.has(badge));

const toBadgePriority = (
  badges: ReadonlyArray<CalendarPatientBadgeDTO>,
): number => {
  const procedurePriority = badges.includes("procedure") ? 0 : 1;
  const hospitalizationPriority = badges.includes("hospitalization") ? 0 : 1;

  return procedurePriority * 10 + hospitalizationPriority;
};

const toCalendarPatientItem = (
  caseDoc: CalendarCaseSource,
  badges: ReadonlySet<CalendarPatientBadgeDTO>,
): CalendarPatientItemDTO | null => {
  const patient = isPopulatedPatient(caseDoc.patientId)
    ? caseDoc.patientId
    : undefined;
  const patientId = toMapperIdString(patient?._id);
  const caseId = toMapperIdString(caseDoc._id);

  if (!patientId || !caseId) {
    return null;
  }

  const hospitalizationReason = caseDoc.admission?.hospitalizationReason?.trim();

  return {
    caseId,
    masterCaseId: toMapperIdString(caseDoc.masterCaseId) || undefined,
    patientId,
    serialId: caseDoc.serialId,
    patientName: typeof patient?.name === "string" ? patient.name : "",
    ownerName: typeof patient?.owner?.name === "string" ? patient.owner.name : "",
    ownerPhoneNumber:
      typeof patient?.owner?.phone === "string" ? patient.owner.phone : "",
    hospitalizationReason:
      hospitalizationReason && hospitalizationReason.length > 0
        ? hospitalizationReason
        : undefined,
    photoName:
      toPatientPhotoUrl(
        patientId,
        typeof patient?.photoName === "string" ? patient.photoName : undefined,
        patient?.updatedAt,
      ) ?? null,
    badges: toSortedBadges(badges),
    flags: {
      isAggressive: caseDoc.flags?.isAggressive === true,
      isEscapePotential: caseDoc.flags?.isEscapePotential === true,
      isAllergic: caseDoc.flags?.isAllergic === true,
      isRiskAnesthesia: caseDoc.flags?.isRiskAnesthesia === true,
      isHeartMurmur: caseDoc.flags?.isHeartMurmur === true,
      isAMB: caseDoc.flags?.isAMB === true,
    },
  };
};

const sortCalendarPatients = (
  left: CalendarPatientItemDTO,
  right: CalendarPatientItemDTO,
): number => {
  const priorityCompare =
    toBadgePriority(left.badges) - toBadgePriority(right.badges);

  if (priorityCompare !== 0) {
    return priorityCompare;
  }

  const nameCompare = left.patientName.localeCompare(right.patientName, "he", {
    numeric: true,
  });

  if (nameCompare !== 0) {
    return nameCompare;
  }

  return left.serialId.localeCompare(right.serialId, "he", { numeric: true });
};

const toSortedCalendarDays = (
  daysByDate: ReadonlyMap<string, CalendarPatientItemDTO[]>,
): CalendarDayDTO[] =>
  Array.from(daysByDate.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, patients]) => ({
      date,
      patients: [...patients].sort(sortCalendarPatients),
    }));

export const buildCalendarMonthResponse = (
  cases: ReadonlyArray<CalendarCaseSource>,
  year: number,
  month: number,
): CalendarMonthResponseDTO => {
  const monthPrefix = toMonthPrefix(year, month);
  const daysByDate = new Map<string, CalendarPatientItemDTO[]>();

  for (const caseDoc of cases) {
    const badgesByDate = new Map<string, Set<CalendarPatientBadgeDTO>>();

    const procedureDateKey =
      caseDoc.flags?.isProcedure === true
        ? toDateInputString(caseDoc.dates?.procedureDate)
        : undefined;

    if (isMonthDateKey(procedureDateKey, monthPrefix)) {
      const badges =
        badgesByDate.get(procedureDateKey) ??
        new Set<CalendarPatientBadgeDTO>();
      badges.add("procedure");
      badgesByDate.set(procedureDateKey, badges);
    }

    for (const row of caseDoc.caseDetailsGrid ?? []) {
      const dayKey = toNormalizedDate(row.date, row.dateTime);
      if (!isMonthDateKey(dayKey, monthPrefix)) {
        continue;
      }

      const badges =
        badgesByDate.get(dayKey) ?? new Set<CalendarPatientBadgeDTO>();
      badges.add("hospitalization");
      badgesByDate.set(dayKey, badges);
    }

    for (const [date, badges] of badgesByDate.entries()) {
      const patientItem = toCalendarPatientItem(caseDoc, badges);
      if (!patientItem) {
        continue;
      }

      const dayItems = daysByDate.get(date) ?? [];
      dayItems.push(patientItem);
      daysByDate.set(date, dayItems);
    }
  }

  return {
    year,
    month,
    days: toSortedCalendarDays(daysByDate),
  };
};
