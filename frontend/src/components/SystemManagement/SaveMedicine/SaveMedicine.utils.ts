import type {
  CreateMedicineDTO,
  SaveMedicineFormDTO,
} from "@petec/shared";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

const getCleanValue = (
  value?: string | number | null,
): string | number | null => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
};

const toRowString = (
  row: RowData | null,
  key: string,
  fallback = "",
): string => {
  const value = row?.[key];
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
};

const toRowNumberOrNull = (row: RowData | null, key: string): number | null => {
  const value = row?.[key];
  return typeof value === "number" ? value : null;
};

const toNullableObjectId = (value?: string | null): string | null =>
  value && value.trim().length > 0 ? value : null;

export const mapRowToSaveMedicineFormDefaults = (
  row: RowData | null,
): SaveMedicineFormDTO => ({
  name: toRowString(row, "name"),
  rangeMax: toRowNumberOrNull(row, "range_max"),
  rangeMin: toRowNumberOrNull(row, "range_min"),
  totalDose: toRowNumberOrNull(row, "total_dose"),
  comments: toRowString(row, "comments", "") || null,
  dosageFrequencyId: toRowString(row, "dosage_frequency_id"),
  routeOfAdministrationId: toRowString(row, "route_of_administration_id"),
  categoryId: toRowString(row, "category_id"),
  measureUnitId: toRowString(row, "measure_unit_id"),
});

export const mapSaveMedicineFormToCreateDto = (
  values: SaveMedicineFormDTO,
): CreateMedicineDTO => ({
  name: values.name,
  rangeMax: getCleanValue(values.rangeMax),
  rangeMin: getCleanValue(values.rangeMin),
  totalDose: getCleanValue(values.totalDose),
  routeOfAdministrationId: toNullableObjectId(values.routeOfAdministrationId),
  dosageFrequencyId: toNullableObjectId(values.dosageFrequencyId),
  measureUnitId: values.measureUnitId,
  categoryId: values.categoryId,
  comments: values.comments ?? null,
});
