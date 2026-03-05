import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

const toTrimmedString = (
  value: string | number | boolean | object | null | undefined,
): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  return "";
};

export const getSystemTypeRowId = (row?: RowData | null): string =>
  toTrimmedString(row?.id ?? row?._id);

export const hasSystemTypeRowId = (row?: RowData | null): boolean =>
  getSystemTypeRowId(row).length > 0;

export const getSystemTypeRowName = (row?: RowData | null): string =>
  toTrimmedString(row?.name);
