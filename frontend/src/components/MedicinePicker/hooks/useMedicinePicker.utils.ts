import type { SimpleSystemTypeDTO } from "@petec/shared";
import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import type { MedicineSelectOptionObj } from "../MedicinePicker.types";

type DoseRecommendationParams = {
  rangeMax?: number;
  rangeMin?: number;
  totalDose?: number;
  doseAmount?: number;
  animalWeight?: number;
};

export const mapSimpleSystemTypesToSelectOptions = (
  items: SimpleSystemTypeDTO[],
): SelectOptionObj[] =>
  items.map((item) => ({
    value: item.id,
    text: item.name,
  }));

export const isDoseAmountOutOfRecommendedRange = ({
  rangeMax,
  rangeMin,
  totalDose,
  doseAmount,
  animalWeight,
}: DoseRecommendationParams): boolean => {
  if (!rangeMax && !rangeMin && !totalDose) {
    return false;
  }

  if (totalDose) {
    if (!doseAmount || Number.isNaN(doseAmount)) {
      return false;
    }
    return doseAmount !== totalDose;
  }

  if (!animalWeight || !doseAmount || Number.isNaN(doseAmount)) {
    return false;
  }

  const isAboveMax =
    rangeMax !== undefined && doseAmount > rangeMax * animalWeight;
  const isBelowMin =
    rangeMin !== undefined && doseAmount < rangeMin * animalWeight;

  return isAboveMax || isBelowMin;
};

export const hasDoseRange = (medicine?: {
  rangeMax?: number | null;
  rangeMin?: number | null;
}): medicine is { rangeMax: number; rangeMin: number } =>
  medicine?.rangeMax !== undefined &&
  medicine?.rangeMax !== null &&
  medicine?.rangeMin !== undefined &&
  medicine?.rangeMin !== null;

const coalesceRecommendationNumber = (
  selectedValue: number | undefined,
  catalogValue: number | undefined,
): number | undefined => {
  if (selectedValue === undefined) {
    return catalogValue;
  }

  if (selectedValue === 0 && catalogValue && catalogValue !== 0) {
    return catalogValue;
  }

  return selectedValue;
};

export const hydrateSelectedMedicinesWithCatalog = (
  selectedMedicines: MedicineSelectOptionObj[],
  medicineCatalog: MedicineSelectOptionObj[],
): MedicineSelectOptionObj[] => {
  const catalogById = new Map(
    medicineCatalog.map((medicine) => [String(medicine.value), medicine]),
  );

  return selectedMedicines.map((selected) => {
    const catalogMedicine = catalogById.get(String(selected.value));
    if (!catalogMedicine) {
      return selected;
    }

    return {
      ...catalogMedicine,
      ...selected,
      measureUnitId: selected.measureUnitId || catalogMedicine.measureUnitId,
      measureUnitText:
        selected.measureUnitText || catalogMedicine.measureUnitText,
      defaultMedicineRouteId:
        selected.defaultMedicineRouteId ??
        catalogMedicine.defaultMedicineRouteId,
      defaultFrequencyId:
        selected.defaultFrequencyId ?? catalogMedicine.defaultFrequencyId,
      rangeMax: coalesceRecommendationNumber(
        selected.rangeMax,
        catalogMedicine.rangeMax,
      ),
      rangeMin: coalesceRecommendationNumber(
        selected.rangeMin,
        catalogMedicine.rangeMin,
      ),
      totalDose: coalesceRecommendationNumber(
        selected.totalDose,
        catalogMedicine.totalDose,
      ),
      comments: selected.comments || catalogMedicine.comments || "",
    };
  });
};
