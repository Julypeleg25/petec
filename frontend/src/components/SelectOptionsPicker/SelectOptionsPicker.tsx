import { useCallback, useEffect, useMemo, useState } from "react";
import FormSelect from "../../utils/FormSelect/FormSelect";
import "./SelectOptionsPicker.css";
import { requestWithSchema } from "../../lib/apiClient";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";
import { SimpleSystemTypeListResponseDTOSchema } from "@petec/shared";

import { SelectOptionsPickerOptionObj } from "./SelectOptionsPicker.types";

interface SelectOptionsPickerProps {
  optionsList: SelectOptionsPickerOptionObj[];
  afterConfirmation?: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
  selectedOptionsList?: SelectOptionsPickerOptionObj[];
  setStateSelectedOptions?: React.Dispatch<
    React.SetStateAction<SelectOptionsPickerOptionObj[]>
  >;
  selectOptionsUrl: string;
  isEdit?: boolean;
}

function SelectOptionsPicker({
  optionsList,
  afterConfirmation,
  selectedOptionsList = [],
  setStateSelectedOptions,
  selectOptionsUrl,
  isEdit = true,
}: SelectOptionsPickerProps) {
  const [selectOptions, setSelectOptions] =
    useState<SelectOptionsPickerOptionObj[]>(optionsList);
  const [selectedOptions, setSelectedOptions] =
    useState<SelectOptionsPickerOptionObj[]>(selectedOptionsList);

  const getSelectOptions = useCallback(async () => {
    try {
      const options = await requestWithSchema(
        { method: "get", url: selectOptionsUrl },
        SimpleSystemTypeListResponseDTOSchema,
      );
      setSelectOptions(
        options.map((option) => ({
          value: option.id,
          text: option.name,
        }))
      );
    } catch { /* handled by interceptor */ }
  }, [selectOptionsUrl]);

  const addOption = useCallback((e: React.FormEvent) => {
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

    const sortFn = (a: SelectOptionsPickerOptionObj, b: SelectOptionsPickerOptionObj) =>
      a.text.localeCompare(b.text);
    setSelectedOptions((prevOptions) => {
      const isExist = prevOptions.some(
        (option) => option.value.toString() === optionId,
      );
      if (isExist) {
        toast.error("האפשרות כבר קיימת ברשימה");
        return prevOptions;
      }

      const nextOptions = [
        ...prevOptions,
        {
          value: optionId,
          text: optionName,
        },
      ].sort(sortFn);

      if (setStateSelectedOptions) {
        setStateSelectedOptions(nextOptions);
      }

      return nextOptions;
    });
  }, [setStateSelectedOptions]);

  const deleteOption = useCallback((index: number) => {
    setSelectedOptions((prevOptions) => {
      const filteredOptions = prevOptions.filter((_, i) => i !== index);
      if (setStateSelectedOptions) {
        setStateSelectedOptions(filteredOptions);
      }
      return filteredOptions;
    });
  }, [setStateSelectedOptions]);

  const optionsToDisplay = useMemo(
    () =>
      !isEdit && selectedOptionsList !== undefined
        ? selectedOptionsList
        : selectedOptions,
    [isEdit, selectedOptions, selectedOptionsList],
  );

  useEffect(() => {
    setSelectOptions(optionsList);
  }, [optionsList]);

  useEffect(() => {
    void getSelectOptions();
  }, [getSelectOptions]);

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
      {optionsToDisplay.length > 0 && (
        <div className="option-picker-selected-options">
          <label className="form-label">האפשרויות שנבחרו:</label>
          {optionsToDisplay.map((option, index) => {
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
