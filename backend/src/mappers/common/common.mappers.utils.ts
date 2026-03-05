import type { Types } from "mongoose";

export type MapperIdValue = string | number | Types.ObjectId;
export type MapperIdContainer = { _id: MapperIdLike };
export type MapperIdLike = MapperIdValue | MapperIdContainer | null | undefined;

export type MapperNamedRef = {
    _id?: MapperIdLike;
    name?: string;
};

const DATE_PART_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})T/;

const toTwoDigits = (value: number): string => String(value).padStart(2, "0");

const toLocalDateKey = (date: Date): string =>
    `${date.getFullYear()}-${toTwoDigits(date.getMonth() + 1)}-${toTwoDigits(date.getDate())}`;

export const toMapperIdString = (value: MapperIdLike): string => {
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

        const dateTimePrefixMatch = DATE_TIME_PREFIX_REGEX.exec(trimmedValue);
        if (dateTimePrefixMatch) {
            return `${dateTimePrefixMatch[1]}-${dateTimePrefixMatch[2]}-${dateTimePrefixMatch[3]}`;
        }

        const parsedString = new Date(trimmedValue);
        if (Number.isNaN(parsedString.getTime())) {
            return undefined;
        }
        return toLocalDateKey(parsedString);
    }
    return toLocalDateKey(value);
};

export const toMapperNamedReference = (ref: MapperIdLike | MapperNamedRef): { id: string; name: string } => {
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
