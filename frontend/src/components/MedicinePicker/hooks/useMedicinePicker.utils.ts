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

export const sortMedicinesByText = (
  medicines: MedicineSelectOptionObj[],
): MedicineSelectOptionObj[] =>
  [...medicines].sort((left, right) => left.text.localeCompare(right.text));

export const findMedicineByValue = (
  medicineList: MedicineSelectOptionObj[],
  value: string,
): MedicineSelectOptionObj | undefined =>
  medicineList.find((medicine) => String(medicine.value) === String(value));

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

  const hasRangeRecommendation = Boolean(rangeMax || rangeMin);

  if (hasRangeRecommendation) {
    if (!animalWeight) {
      return false;
    }

    return Boolean(
      (rangeMax &&
        doseAmount &&
        !Number.isNaN(doseAmount) &&
        doseAmount > rangeMax * animalWeight) ||
      (rangeMin &&
        doseAmount &&
        !Number.isNaN(doseAmount) &&
        doseAmount < rangeMin * animalWeight),
    );
  }

  return Boolean(
    totalDose &&
      doseAmount &&
      !Number.isNaN(doseAmount) &&
      doseAmount !== totalDose,
  );
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
      toComparableDoseAmount(draftSelection.doseAmountInput) ||
    (originalMedicine.comments ?? "") !== draftSelection.comments
  );
};

export const hasDoseRange = (medicine?: {
  rangeMax?: number | null;
  rangeMin?: number | null;
}): medicine is { rangeMax: number; rangeMin: number } =>
  Boolean(medicine?.rangeMax && medicine?.rangeMin);

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

  if (!animalWeight) {
    return undefined;
  }

  if (selected.rangeMin && selected.rangeMax) {
    if (selected.rangeMax === selected.rangeMin) {
      return Number.parseFloat((selected.rangeMax * animalWeight).toFixed(2));
    }

    return Number.parseFloat(
      (((selected.rangeMin + selected.rangeMax) / 2) * animalWeight).toFixed(
        2,
      ),
    );
  }

  if (selected.totalDose) {
    return selected.totalDose;
  }

  return undefined;
};

export const calculateDoseAmountFromRangeInput = (
  value: number,
  animalWeight?: number,
): string | undefined => {
  if (!animalWeight) {
    return undefined;
  }

  return (value * animalWeight).toFixed(2);
};

export const parseDoseAmountInputValue = (
  value: string,
): number | undefined => (value === "" ? undefined : Number.parseFloat(value));

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
