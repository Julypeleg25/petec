import type { SelectOptionsPickerOptionObj } from "./SelectOptionsPicker.types";

const normalizeOptionsSelection = (
  options: SelectOptionsPickerOptionObj[],
): string =>
  [...options]
    .map((option) => ({
      value: String(option.value),
      text: option.text,
    }))
    .sort((left, right) =>
      left.value === right.value
        ? left.text.localeCompare(right.text)
        : left.value.localeCompare(right.value),
    )
    .map((option) => `${option.value}:${option.text}`)
    .join("|");

export const isOptionsSelectionConfirmationDisabled = (
  selectedOptions: SelectOptionsPickerOptionObj[],
  initialOptions: SelectOptionsPickerOptionObj[],
  requireSelectionChangeForConfirmation: boolean,
): boolean => {
  if (!requireSelectionChangeForConfirmation) {
    return false;
  }

  return (
    normalizeOptionsSelection(selectedOptions) ===
    normalizeOptionsSelection(initialOptions)
  );
};
