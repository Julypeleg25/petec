import { Types } from "mongoose";
import { ValidationError } from "@constants/error.constants";
import type { ICaseDetailsRow } from "@models/case";

export interface GridValidationIssue {
  path: string;
  message: string;
}

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})T/;

const toTwoDigits = (value: number): string => String(value).padStart(2, "0");

const toLocalDateKey = (value: Date): string =>
  `${value.getFullYear()}-${toTwoDigits(value.getMonth() + 1)}-${toTwoDigits(value.getDate())}`;

const toTimeKey = (value: Date): string =>
  `${toTwoDigits(value.getHours())}:${toTwoDigits(value.getMinutes())}`;

const toParsedDate = (value: string | number | Date | null | undefined): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const normalizeTime = (time: string): string => {
  const trimmedTime = String(time).trim();
  const match = TIME_REGEX.exec(trimmedTime);
  if (!match) {
    throw new ValidationError("Invalid time format, expected HH:mm", {
      time: [trimmedTime],
    });
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const normalizeDate = (date: string): string => {
  const trimmedDate = String(date).trim();
  const dateMatch = DATE_REGEX.exec(trimmedDate);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  const dateTimePrefixMatch = DATE_TIME_PREFIX_REGEX.exec(trimmedDate);
  if (dateTimePrefixMatch) {
    return `${dateTimePrefixMatch[1]}-${dateTimePrefixMatch[2]}-${dateTimePrefixMatch[3]}`;
  }

  const parsedDate = new Date(trimmedDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ValidationError("Invalid date format, expected YYYY-MM-DD", {
      date: [trimmedDate],
    });
  }

  return toLocalDateKey(parsedDate);
};

const computeDateTime = (date: string, time: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const [hourRaw, minuteRaw] = time.split(":");

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const dateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(dateTime.getTime())) {
    throw new ValidationError("Cannot compute dateTime from date+time", {
      date: [date],
      time: [time],
    });
  }
  return dateTime;
};

const ensureId = <T extends { _id?: Types.ObjectId }>(
  item: T,
): T & { _id: Types.ObjectId } => {
  if (!item._id) {
    return { ...item, _id: new Types.ObjectId() };
  }
  return item as T & { _id: Types.ObjectId };
};

const deriveFoodAndWater = (row: ICaseDetailsRow): string | null => {
  if (row.foodAndWater != null) {
    return row.foodAndWater;
  }
  if (row.foodGiven == null && row.waterGiven == null) {
    return null;
  }

  const parts: string[] = [];
  if (row.foodGiven) {
    parts.push("אוכל");
  }
  if (row.waterGiven) {
    parts.push("מים");
  }
  return parts.length > 0 ? parts.join(" + ") : null;
};

const resolveRowDate = (row: ICaseDetailsRow): string => {
  const rawDate = typeof row.date === "string" ? row.date.trim() : "";
  if (rawDate.length > 0) {
    return normalizeDate(rawDate);
  }

  const parsedDateTime = toParsedDate(row.dateTime);
  if (parsedDateTime) {
    return toLocalDateKey(parsedDateTime);
  }

  throw new ValidationError("Row date is required", {
    date: ["missing"],
  });
};

const resolveRowTime = (row: ICaseDetailsRow): string => {
  const rawTime = typeof row.time === "string" ? row.time.trim() : "";
  if (rawTime.length > 0) {
    return normalizeTime(rawTime);
  }

  const parsedDateTime = toParsedDate(row.dateTime);
  if (parsedDateTime) {
    return toTimeKey(parsedDateTime);
  }

  throw new ValidationError("Row time is required", {
    time: ["missing"],
  });
};

const normalizeRow = (row: ICaseDetailsRow): ICaseDetailsRow => {
  const date = resolveRowDate(row);
  const time = resolveRowTime(row);

  return {
    ...row,
    _id: row._id ?? new Types.ObjectId(),
    date,
    time,
    dateTime: computeDateTime(date, time),
    index: Number.isFinite(Number(row.index)) ? Number(row.index) : 0,
    temperatureIsRequired: row.temperatureIsRequired ?? false,
    temperatureIsEditable: row.temperatureIsEditable ?? true,
    pulseIsRequired: row.pulseIsRequired ?? false,
    pulseIsEditable: row.pulseIsEditable ?? true,
    respirationIsRequired: row.respirationIsRequired ?? false,
    respirationIsEditable: row.respirationIsEditable ?? true,
    urineIsRequired: row.urineIsRequired ?? false,
    urineIsEditable: row.urineIsEditable ?? true,
    fecesIsRequired: row.fecesIsRequired ?? false,
    fecesIsEditable: row.fecesIsEditable ?? true,
    isBoxCleanIsRequired: row.isBoxCleanIsRequired ?? false,
    isBoxCleanIsEditable: row.isBoxCleanIsEditable ?? true,
    isReleaseIsRequired: row.isReleaseIsRequired ?? false,
    isReleaseIsEditable: row.isReleaseIsEditable ?? true,
    isTravelIsRequired: row.isTravelIsRequired ?? false,
    isTravelIsEditable: row.isTravelIsEditable ?? true,
    weighIsRequired: row.weighIsRequired ?? false,
    weighIsEditable: row.weighIsEditable ?? true,
    pukeIsRequired: row.pukeIsRequired ?? false,
    pukeIsEditable: row.pukeIsEditable ?? true,
    rowCommentsIsRequired: row.rowCommentsIsRequired ?? false,
    rowCommentsIsEditable: row.rowCommentsIsEditable ?? true,
    ownerUpdateIsRequired: row.ownerUpdateIsRequired ?? false,
    ownerUpdateIsEditable: row.ownerUpdateIsEditable ?? true,
    foodAndWater: deriveFoodAndWater(row),
    foodAndWaterIsRequired: row.foodAndWaterIsRequired ?? false,
    foodAndWaterIsEditable: row.foodAndWaterIsEditable ?? true,
    fluids: (row.fluids ?? []).map(ensureId),
    medicines: (row.medicines ?? []).map(ensureId),
    procedures: (row.procedures ?? []).map(ensureId),
    examinations: (row.examinations ?? []).map(ensureId),
    foodExtras: (row.foodExtras ?? []).map(ensureId),
  };
};

export const normalizeCaseDetailsGrid = (
  grid: Partial<ICaseDetailsRow>[][] | Partial<ICaseDetailsRow>[],
): ICaseDetailsRow[] => {
  const flatRows =
    Array.isArray(grid[0]) && Array.isArray((grid as Partial<ICaseDetailsRow>[][])[0])
      ? (grid as Partial<ICaseDetailsRow>[][]).flat()
      : (grid as Partial<ICaseDetailsRow>[]);

  const normalizedRows = flatRows.map((row) => normalizeRow(row as ICaseDetailsRow));
  normalizedRows.sort((left, right) => {
    const dateTimeCompare = left.dateTime.getTime() - right.dateTime.getTime();
    if (dateTimeCompare !== 0) {
      return dateTimeCompare;
    }

    const indexCompare = left.index - right.index;
    if (indexCompare !== 0) {
      return indexCompare;
    }

    return (left._id?.toString() ?? "").localeCompare(right._id?.toString() ?? "");
  });

  return normalizedRows;
};

export const validateCaseDetailsGrid = (
  _rows: ReadonlyArray<ICaseDetailsRow>,
): GridValidationIssue[] => {
  return [];
};

export const toGridValidationDetails = (
  issues: ReadonlyArray<GridValidationIssue>,
): Record<string, string[]> => {
  const details: Record<string, string[]> = {};
  for (const issue of issues) {
    if (!details[issue.path]) {
      details[issue.path] = [];
    }
    details[issue.path].push(issue.message);
  }
  return details;
};
