import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import FormSelect from "../../utils/FormSelect/FormSelect";
import "./SelectOptionsPicker.css";
import { FaPlus } from "react-icons/fa";
import type { SelectOptionsPickerProps } from "./SelectOptionsPicker.types";
import { isOptionsSelectionConfirmationDisabled } from "./SelectOptionsPicker.utils";
import { useSelectOptionsPicker } from "./hooks/useSelectOptionsPicker";
import { SelectOptionsPickerSelectedItem } from "./components/SelectOptionsPickerSelectedItem";

function SelectOptionsPicker({
  optionsList,
  afterConfirmation,
  selectedOptionsList = [],
  confirmationBaselineOptions = selectedOptionsList,
  setStateSelectedOptions,
  selectOptionsUrl,
  isEdit = true,
  requireSelectionChangeForConfirmation = false,
  confirmationPreamble,
}: SelectOptionsPickerProps) {
  const {
    selectOptions,
    selectedOptions,
    selectedFormValue,
    setSelectedFormValue,
    optionsToDisplay,
    addOption,
    deleteOption,
  } = useSelectOptionsPicker({
    optionsList,
    selectedOptionsList,
    setStateSelectedOptions,
    selectOptionsUrl,
    isEdit,
  });

  const isConfirmationDisabled = useMemo(() => {
    return isOptionsSelectionConfirmationDisabled(
      selectedOptions,
      confirmationBaselineOptions,
      requireSelectionChangeForConfirmation,
    );
  }, [
    requireSelectionChangeForConfirmation,
    selectedOptions,
    confirmationBaselineOptions,
  ]);
  const isAddDisabled = useMemo(
    () => selectedFormValue === "",
    [selectedFormValue],
  );

  const handleConfirmClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isConfirmationDisabled || !afterConfirmation) {
        return;
      }

      afterConfirmation(selectedOptions);
    },
    [afterConfirmation, isConfirmationDisabled, selectedOptions],
  );

  return (
    <div className="SelectOptionsPicker" dir="rtl" lang="he">
      {isEdit && (
        <div className="options-inputs-container">
          <div>
            <FormSelect
              elements={selectOptions}
              selectId={"options-select"}
              width="100%"
              isRequired={true}
              optionState={selectedFormValue}
              setOptionState={setSelectedFormValue}
            />
          </div>
          <button
            className="add-option-btn"
            disabled={isAddDisabled}
            onClick={addOption}
          >
            <FaPlus />
          </button>
        </div>
      )}
      {optionsToDisplay.length > 0 && (
        <div className="option-picker-selected-options">
          <label className="form-label">האפשרויות שנבחרו:</label>
          {optionsToDisplay.map((option, index) => {
            return (
              <SelectOptionsPickerSelectedItem
                key={`${option.value}-${index}`}
                option={option}
                index={index}
                isEdit={isEdit}
                onDelete={deleteOption}
              />
            );
          })}
        </div>
      )}
      {confirmationPreamble}
      {afterConfirmation && (
        <button
          className="confirm-option-btn"
          disabled={isConfirmationDisabled}
          onClick={handleConfirmClick}
        >
          אישור
        </button>
      )}
    </div>
  );
}

export default SelectOptionsPicker;
