import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";
import type { FieldDescriptor } from "./SystemTypeForm.types";
import { getSystemTypeRowId } from "../shared/systemTypeRow.utils";

type PrimitiveRowValue = string | number | boolean | null | undefined;
type SystemTypeFormValues = Record<string, string>;
type SystemTypePayload = Record<string, string | number | boolean | null>;

const toSnakeCase = (value: string): string =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

const toCamelCase = (value: string): string =>
  value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

const toValueText = (value: RowData[string] | undefined): string => {
  if (value === undefined || value === null) {
    return "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return "";
};

const getFieldLookupKeys = (field: FieldDescriptor): string[] => {
  const keys = new Set<string>([field.name, toSnakeCase(field.name)]);
  if (field.sourceKey) {
    keys.add(field.sourceKey);
    keys.add(toCamelCase(field.sourceKey));
    keys.add(toSnakeCase(field.sourceKey));
  }
  return Array.from(keys);
};

const getFirstFieldValue = (
  row: RowData | undefined,
  keys: ReadonlyArray<string>,
): PrimitiveRowValue => {
  if (!row) {
    return undefined;
  }

  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return value;
      }
    }
  }

  return undefined;
};

export const resolveSystemTypeRowId = (row?: RowData): string => {
  return getSystemTypeRowId(row);
};

export const buildSystemTypeInitialValues = (
  fields: readonly FieldDescriptor[],
  row?: RowData,
): SystemTypeFormValues => {
  const values: SystemTypeFormValues = {};

  for (const field of fields) {
    const keys = getFieldLookupKeys(field);
    const resolvedValue = getFirstFieldValue(row, keys);
    values[field.name] = toValueText(resolvedValue);
  }

  return values;
};

export const buildSystemTypePayload = (
  fields: readonly FieldDescriptor[],
  values: SystemTypeFormValues,
): SystemTypePayload => {
  const payload: SystemTypePayload = {};

  for (const field of fields) {
    const rawValue = values[field.name] ?? "";
    const trimmedValue = rawValue.trim();

    if (field.kind === "number") {
      if (trimmedValue === "") {
        payload[field.name] = null;
        continue;
      }
      payload[field.name] = Number(trimmedValue);
      continue;
    }

    if (trimmedValue === "") {
      continue;
    }

    payload[field.name] = trimmedValue;
  }

  return payload;
};
