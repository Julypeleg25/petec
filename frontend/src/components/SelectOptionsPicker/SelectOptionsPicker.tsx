import { useEffect, useState } from "react";
import FormSelect from "../../utils/FormSelect/FormSelect";
import "./SelectOptionsPicker.css";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";

import { SelectOptionsPickerOptionObj, SystemTypeItem, SelectOptionsPickerProps } from "./SelectOptionsPicker.types";

function SelectOptionsPicker({
  optionsList,
  afterConfirmation,
  selectedOptionsList = [],
  setStateSelectedOptions,
  selectOptionsUrl,
  isEdit = true,
}: SelectOptionsPickerProps) {
  const [selectOptions, setSelectOptions] =
    useState<SelectOptionsPickerOptionObj[]>();
  const [selectedOptions, setSelectedOptions] =
    useState<SelectOptionsPickerOptionObj[]>(selectedOptionsList);

  const getSelectOptions = async () => {
    try {
      const res = await apiClient.get<SystemTypeItem[]>(selectOptionsUrl);
      setSelectOptions(
        res.data.map((option) => ({
          value: option.id,
          text: option.name,
        }))
      );
    } catch { /* handled by interceptor */ }
  };

  const addOption = (e: React.FormEvent) => {
    e.preventDefault();

    const optionsSelect = document.getElementById(
      "options-select"
    ) as HTMLSelectElement;
    const optionId = optionsSelect.options[optionsSelect.selectedIndex].value;
    const optionName =
      optionsSelect.options[optionsSelect.selectedIndex].innerText;

    if (optionId === "") {
      toast.error("יש לבחור אפשרות");
      return;
    }

    let isExist = false;
    selectedOptions.forEach((option) => {
      if (option.value.toString() === optionId) isExist = true;
    });

    if (isExist) {
      toast.error("האפשרות כבר קיימת ברשימה");
      return;
    }

    const options = [
      ...selectedOptions,
      {
        value: optionId,
        text: optionName,
      },
    ];

    const sortFn = (a: SelectOptionsPickerOptionObj, b: SelectOptionsPickerOptionObj) =>
      a.text.localeCompare(b.text);

    setSelectedOptions(options.sort(sortFn));
    if (setStateSelectedOptions) setStateSelectedOptions(options.sort(sortFn));
  };

  const deleteOption = (index: number) => {
    const filteredOptions = selectedOptions.filter((_, i) => i !== index);
    setSelectedOptions(filteredOptions);
    if (setStateSelectedOptions) setStateSelectedOptions(filteredOptions);
  };

  useEffect(() => {
    getSelectOptions();
  }, []);

  return (
    <div className="SelectOptionsPicker">
      {isEdit && (
        <div className="options-inputs-container">
          <div>
            <FormSelect
              elements={selectOptions}
              selectId={"options-select"}
              width="100%"
              isRequired={true}
            />
          </div>
          <button className="add-option-btn" onClick={addOption}>
            <FaPlus />
          </button>
        </div>
      )}
      {(!isEdit && selectedOptionsList !== undefined
        ? selectedOptionsList
        : selectedOptions
      ).length > 0 && (
        <div className="option-picker-selected-options">
          <label className="form-label">האפשרויות שנבחרו:</label>
          {(!isEdit && selectedOptionsList !== undefined
            ? selectedOptionsList
            : selectedOptions
          ).map((option, index) => {
            return (
              <div key={index} className="option-picker-selected-options-cell">
                {isEdit && (
                  <button
                    className="delete-option-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteOption(index);
                    }}
                  >
                    <FaTrash />
                  </button>
                )}
                <div>
                  {option.text}
                  {!isEdit && " -"}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {afterConfirmation && (
        <button
          className="confirm-option-btn"
          onClick={(e) => {
            e.preventDefault();
            afterConfirmation(selectedOptions);
          }}
        >
          אישור
        </button>
      )}
    </div>
  );
}

export default SelectOptionsPicker;
