import type { BaseLookup } from "../../../types/global.types.js";

export const BULK_TEMPLATE_CSV = {
  HEADER: "name,isDeleted",
  LINE_BREAK: "\n",
  MIN_LINES_WITH_HEADER: 2,
  ENCODING: "utf-8",
} as const;

export type BulkTemplateCsvRow = {
  name: string;
  isDeleted: boolean;
};

export const toBulkTemplateCsvRow = (doc: BaseLookup): string =>
  `${doc.name ?? ""},${doc.isDeleted ?? false}`;

export const parseBulkTemplateCsvLine = (
  line: string,
): BulkTemplateCsvRow | null => {
  const parts = line.split(",").map((part) => part.trim());
  if (parts.length < 2 || !parts[0]) {
    return null;
  }
  return {
    name: parts[0],
    isDeleted: parts.length > 1 ? parts[1]?.toLowerCase() === "true" : false,
  };
};
