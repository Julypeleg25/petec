import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import type {
  MedicinePickerDraftSelection,
  MedicineSelectOptionObj,
} from "../MedicinePicker.types";

type DoseRecommendationParams = {
  rangeMax?: number;
  rangeMin?: number;
  totalDose?: number;
  doseAmount?: number;
  animalWeight?: number;
};

export type MedicineSelectionSource = "catalog" | "selected";

const toComparableId = (value?: string | number | null): string =>
  value == null ? "" : String(value);

export const toNonEmptyString = (value?: string | number | null): string =>
  value == null ? "" : String(value);

const toComparableDoseAmount = (
  value?: string | number | null,
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isNaN(numericValue) ? null : numericValue;
};

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

export const hasMedicinePickerDraftChanged = (
  originalMedicine: MedicineSelectOptionObj | undefined,
  draftSelection: MedicinePickerDraftSelection,
): boolean => {
  if (!originalMedicine) {
    return false;
  }

  return (
    toComparableId(originalMedicine.value) !== draftSelection.medicineValue ||
    toComparableId(originalMedicine.routeOfAdministrationId) !==
      draftSelection.routeOfAdministrationId ||
    toComparableId(originalMedicine.dosageFrequencyId) !==
      draftSelection.dosageFrequencyId ||
    toComparableDoseAmount(originalMedicine.doseAmount) !==
      toComparableDoseAmount(draftSelection.doseAmountInput)
  );
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

export const resolveDoseAmountBySelection = (
  selected: MedicineSelectOptionObj,
  animalWeight?: number,
  source: MedicineSelectionSource = "catalog",
): number | undefined => {
  if (source === "selected") {
    return selected.doseAmount;
  }

  if (selected.totalDose !== undefined && selected.totalDose !== null) {
    return selected.totalDose;
  }

  if (!animalWeight || !hasDoseRange(selected)) {
    return undefined;
  }

  if (selected.rangeMax === selected.rangeMin) {
    return Number.parseFloat((selected.rangeMax * animalWeight).toFixed(2));
  }

  return Number.parseFloat(
    (((selected.rangeMin + selected.rangeMax) / 2) * animalWeight).toFixed(2),
  );
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
      measureUnitTypeId: selected.measureUnitTypeId || catalogMedicine.measureUnitTypeId || "",
      measureUnitText:
        selected.measureUnitText || catalogMedicine.measureUnitText,
      frequencyText:
        selected.frequencyText || catalogMedicine.frequencyText,
      medicineRouteText:
        selected.medicineRouteText || catalogMedicine.medicineRouteText,
      routeOfAdministrationId:
        selected.routeOfAdministrationId ||
        catalogMedicine.routeOfAdministrationId ||
        "",
      dosageFrequencyId:
        selected.dosageFrequencyId ||
        catalogMedicine.dosageFrequencyId ||
        "",
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
