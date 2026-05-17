import type { Types } from "mongoose";

export type MapperIdValue = string | number | Types.ObjectId;
export type MapperIdContainer = { _id: MapperReferenceId };
export type MapperReferenceId = MapperIdValue | MapperIdContainer | null | undefined;

export type MapperNamedRef = {
    _id?: MapperReferenceId;
    name?: string;
};

export const DATE_PART_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
export const DATE_TIME_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})T/;
export const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const JERUSALEM_TIME_ZONE = "Asia/Jerusalem";
const JERUSALEM_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
    timeZone: JERUSALEM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export const toTwoDigits = (value: number): string => String(value).padStart(2, "0");

export const toLocalDateKey = (date: Date): string =>
    `${date.getFullYear()}-${toTwoDigits(date.getMonth() + 1)}-${toTwoDigits(date.getDate())}`;

const toJerusalemDateKeyFromDate = (date: Date): string | undefined => {
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    const parts = JERUSALEM_DATE_FORMATTER.formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        return undefined;
    }

    return `${year}-${month}-${day}`;
};

export const toTimeKey = (date: Date): string =>
    `${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;

export const toMapperIdString = (value: MapperReferenceId): string => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && value !== null) {
        const nestedId = (value as { id?: string | number }).id;
        if (typeof nestedId === "string" || typeof nestedId === "number") {
            return String(nestedId);
        }
    }
    if (typeof value === "object" && "_id" in value) {
        const nestedValue = value._id;
        if (nestedValue === value) {
            return String(value);
        }
        return toMapperIdString(nestedValue);
    }
    return String(value);
};

export const toIsoDateString = (value?: Date | string | null): string | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const toNullableIsoDateString = (
    value?: Date | string | null,
): string | null => {
    const iso = toIsoDateString(value);
    return iso ?? null;
};

export const toDateInputString = (value?: Date | string | null): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") {
        const trimmedValue = value.trim();
        const dateMatch = DATE_PART_REGEX.exec(trimmedValue);
        if (dateMatch) {
            return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }
        const parsedString = new Date(trimmedValue);
        if (Number.isNaN(parsedString.getTime())) {
            return undefined;
        }
        return toJerusalemDateKeyFromDate(parsedString);
    }
    return toJerusalemDateKeyFromDate(value);
};

export const toCanonicalJerusalemDate = (
    value?: Date | string | null,
): Date | undefined => {
    const dateKey = toDateInputString(value);
    if (!dateKey) {
        return undefined;
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
};

export const toMapperNamedReference = (ref: MapperReferenceId | MapperNamedRef): { id: string; name: string } => {
    if (typeof ref === "object" && ref !== null) {
        return {
            id: "_id" in ref ? toMapperIdString(ref._id) : String(ref),
            name: "name" in ref ? String(ref.name ?? "") : "",
        };
    }
    return {
        id: toMapperIdString(ref),
        name: "",
    };
};

export const toNullableTrimmedString = (
    value?: string | null,
): string | null => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const toNullableFiniteNumber = (
    value?: number | null,
): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

export const toBooleanWithDefault = (
    value: boolean | null | undefined,
    fallback: boolean,
): boolean => (typeof value === "boolean" ? value : fallback);

export const toGiven = (value?: boolean | null): boolean => value === true;

export const toOptionalBoolean = (
    value?: boolean | null,
): boolean | undefined => (typeof value === "boolean" ? value : undefined);

export const toBooleanOrNull = (value?: boolean | null): boolean | null =>
    typeof value === "boolean" ? value : null;

export const toOptionalString = (value?: string | null): string | undefined =>
    typeof value === "string" ? value : undefined;

export const toStringOrNull = (value?: string | number | null): string | null =>
    value == null ? null : String(value);

export const toParsedDate = (value: Date | string | number | null | undefined): Date | null => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === "string" || typeof value === "number") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

export const toFiniteNumber = (
    value?: number | string | null,
): number | undefined => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

export const toNormalizedDate = (
    date?: string | null,
    dateTime?: Date | string,
): string => {
    if (typeof date === "string") {
        const trimmedDate = date.trim();
        if (trimmedDate.length > 0) {
            const dateMatch = DATE_PART_REGEX.exec(trimmedDate);
            if (dateMatch) {
                return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            }
            const dateTimePrefixMatch = DATE_TIME_PREFIX_REGEX.exec(trimmedDate);
            if (dateTimePrefixMatch) {
                return `${dateTimePrefixMatch[1]}-${dateTimePrefixMatch[2]}-${dateTimePrefixMatch[3]}`;
            }
            const parsedDate = toParsedDate(trimmedDate);
            if (parsedDate) {
                return toLocalDateKey(parsedDate);
            }
        }
    }
    const parsedDateTime = toParsedDate(dateTime);
    return parsedDateTime ? toLocalDateKey(parsedDateTime) : "";
};

export const toNormalizedTime = (
    time?: string | null,
    dateTime?: Date | string,
): string => {
    if (typeof time === "string") {
        const trimmedTime = time.trim();
        if (trimmedTime.length > 0) {
            const timeMatch = TIME_REGEX.exec(trimmedTime);
            if (timeMatch) {
                return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
            }
        }
    }
    const parsedDateTime = toParsedDate(dateTime);
    return parsedDateTime ? toTimeKey(parsedDateTime) : "";
};
