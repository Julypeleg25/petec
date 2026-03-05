import { Types } from "mongoose";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type { MongoFilter } from "@app-types/global.types";
import type {
  MedicineLeanDoc,
  PopulatedRefDoc,
  SimpleTypeLeanDoc,
} from "@app-types/medicine.types";
import type { MedicineDTO, SimpleSystemTypeDTO } from "@petec/shared";
import { escapeRegex } from "@mappers/table/table.mappers.utils";

export type MedicineCategoryLeanDoc = {
  _id: Types.ObjectId | string;
  name?: string | null;
  serialId?: string | null;
};

export const MEDICINE_SERVICE_TYPES = {
  MEDICINES: SYSTEM_TYPE_NAMES.MEDICINES,
  MEDICINE_CATEGORIES: SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
  DOSAGE_FREQUENCIES: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
  ROUTES_OF_ADMINISTRATION: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
  MEASURE_UNIT_TYPES: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
} as const;

export const MEDICINE_SORT = { name: 1 } as const;
export const MEDICINE_ACTIVE_FILTER = { isDeleted: { $ne: true } } as const;
const CATEGORY_TOKEN_SPLIT_REGEX = /[^\p{L}\p{N}]+/u;

export const toExactLookupRegex = (value: string): RegExp =>
  new RegExp(`^${escapeRegex(value.trim())}$`, "i");

export const toCategoryLookupTokens = (value: string): string[] =>
  value
    .trim()
    .toLowerCase()
    .split(CATEGORY_TOKEN_SPLIT_REGEX)
    .filter((token) => token.length > 0);

export const toNormalizedCategoryLookupKey = (value: string): string =>
  toCategoryLookupTokens(value).sort().join(":");

export const isCategoryLookupEquivalent = (
  left: string,
  right: string,
): boolean => {
  const leftKey = toNormalizedCategoryLookupKey(left);
  const rightKey = toNormalizedCategoryLookupKey(right);
  return leftKey.length > 0 && leftKey === rightKey;
};

export const matchesCategoryLookupValue = (
  category: MedicineCategoryLeanDoc,
  lookupValue: string,
): boolean => {
  const candidates = [category.serialId, category.name].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return candidates.some((value) =>
    isCategoryLookupEquivalent(value, lookupValue),
  );
};

const toReferenceId = (value?: PopulatedRefDoc | null): string | null => {
  if (value == null) {
    return null;
  }
  const id =
    typeof value._id === "object" ? value._id.toString() : String(value._id);
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toPopulatedReference = (
  value?: PopulatedRefDoc | null,
): { id: string; name: string } | undefined => {
  const id = toReferenceId(value);
  if (!id) {
    return undefined;
  }
  return {
    id,
    name: typeof value.name === "string" ? value.name : "",
  };
};

export const mapMedicineDocToDto = (doc: MedicineLeanDoc): MedicineDTO => ({
  id: doc._id != null ? String(doc._id) : "",
  name: String(doc.name ?? ""),
  isDeleted: doc.isDeleted ?? false,
  serialId: doc.serialId ?? undefined,
  measureUnitId: toPopulatedReference(doc.measureUnitId ?? undefined),
  rangeMax: doc.rangeMax ?? undefined,
  rangeMin: doc.rangeMin ?? undefined,
  totalDose: doc.totalDose ?? undefined,
  comments: doc.comments ?? undefined,
  routeOfAdministrationId: toPopulatedReference(
    doc.routeOfAdministrationId ?? undefined,
  ),
  dosageFrequencyId: toPopulatedReference(doc.dosageFrequencyId ?? undefined),
  categoryId: toPopulatedReference(doc.categoryId ?? undefined),
  defaultUnit: doc.defaultUnit ?? undefined,
});

export const mapSimpleTypeDocToDto = (
  doc: SimpleTypeLeanDoc,
): SimpleSystemTypeDTO => ({
  id: doc._id != null ? String(doc._id) : "",
  name: String(doc.name ?? ""),
  isDeleted: doc.isDeleted ?? false,
  serialId: doc.serialId,
});

export const buildCategoryLookupFilters = (
  normalizedCategoryValue: string,
): MongoFilter[] => {
  const filters: MongoFilter[] = [
    { serialId: toExactLookupRegex(normalizedCategoryValue) },
    { name: toExactLookupRegex(normalizedCategoryValue) },
  ];

  if (Types.ObjectId.isValid(normalizedCategoryValue)) {
    filters.unshift({ _id: new Types.ObjectId(normalizedCategoryValue) });
  }

  return filters;
};

export type ResolveCategoryByValue = (
  categoryValue: string,
) => Promise<MedicineCategoryLeanDoc | null>;
