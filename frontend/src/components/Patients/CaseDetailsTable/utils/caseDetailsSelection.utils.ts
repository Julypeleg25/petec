import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";
import type {
  CaseDetailsMedicineCell,
  CaseDetailsOptionCell,
} from "../CaseDetailsTable.types";

export const getCheckboxesValuesAfterOptionsSelection = (
  selectedOptions: MedicineSelectOptionObj[],
  currentValues: CaseDetailsMedicineCell[],
): CaseDetailsMedicineCell[] => {
  const currentValuesById = new Map(
    currentValues.map((item) => [item.value, item]),
  );
  return selectedOptions.map((option) => {
    const currentValue = currentValuesById.get(option.value);
    return {
      ...option,
      isGiven: currentValue?.isGiven ?? false,
      isRequired: currentValue?.isRequired ?? false,
      isEditable: currentValue?.isEditable ?? true,
      comment: currentValue?.comment ?? null,
    };
  });
};

export const getCheckboxesValuesAfterOptionsSelectionForOptions = (
  selectedOptions: SelectOptionsPickerOptionObj[],
  currentValues: CaseDetailsOptionCell[],
): CaseDetailsOptionCell[] => {
  const currentValuesById = new Map(
    currentValues.map((item) => [item.value, item]),
  );
  return selectedOptions.map((option) => {
    const currentValue = currentValuesById.get(option.value);
    return {
      ...option,
      isGiven: currentValue?.isGiven ?? false,
      isRequired: currentValue?.isRequired ?? false,
      isEditable: currentValue?.isEditable ?? true,
      comment: currentValue?.comment ?? null,
      exam_value: currentValue?.exam_value ?? null,
    };
  });
};
