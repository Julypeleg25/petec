import type {
  MedicinePickerSelectableOption,
  MedicineSelectOptionObj,
} from "./MedicinePicker.types";

const toMedicineComparableKey = (
  medicine: Pick<
    MedicineSelectOptionObj,
    | "value"
    | "routeOfAdministrationId"
    | "dosageFrequencyId"
    | "doseAmount"
    | "comments"
  >,
): string =>
  [
    String(medicine.value),
    String(medicine.routeOfAdministrationId ?? ""),
    String(medicine.dosageFrequencyId ?? ""),
    String(medicine.doseAmount ?? ""),
    medicine.comments?.trim() ?? "",
  ].join(":");

const normalizeMedicineSelection = (
  medicines: MedicineSelectOptionObj[],
): string =>
  [...medicines]
    .sort((left, right) =>
      toMedicineComparableKey(left).localeCompare(
        toMedicineComparableKey(right),
      ),
    )
    .map(toMedicineComparableKey)
    .join("|");

export const isMedicineSelectionConfirmationDisabled = (
  selectedMedicines: MedicineSelectOptionObj[],
  initialMedicines: MedicineSelectOptionObj[],
  requireSelectionChangeForConfirmation: boolean,
): boolean => {
  if (!requireSelectionChangeForConfirmation) {
    return false;
  }

  return (
    normalizeMedicineSelection(selectedMedicines) ===
    normalizeMedicineSelection(initialMedicines)
  );
};

export const buildMedicinePickerSelectableOptions = (
  medicineList: MedicineSelectOptionObj[],
  selectedMedicines: MedicineSelectOptionObj[],
  editingMedicineValue: string,
): MedicinePickerSelectableOption[] =>
  medicineList.map((medicine) => ({
    ...medicine,
    isDisabled:
      selectedMedicines.some(
        (selectedMedicine) =>
          String(selectedMedicine.value) === String(medicine.value),
      ) && String(medicine.value) !== editingMedicineValue,
  }));
