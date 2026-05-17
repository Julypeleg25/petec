import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SimpleSystemTypeListResponseDTOSchema } from "@petec/shared";
import { requestWithSchema } from "../../../lib/apiClient";
import type {
  SelectOptionsPickerOptionObj,
  SelectOptionsPickerProps,
} from "../SelectOptionsPicker.types";

type UseSelectOptionsPickerParams = Pick<
  SelectOptionsPickerProps,
  | "optionsList"
  | "selectedOptionsList"
  | "setStateSelectedOptions"
  | "selectOptionsUrl"
  | "isEdit"
>;

export function useSelectOptionsPicker({
  optionsList,
  selectedOptionsList = [],
  setStateSelectedOptions,
  selectOptionsUrl,
  isEdit = true,
}: UseSelectOptionsPickerParams) {
  const [selectOptions, setSelectOptions] =
    useState<SelectOptionsPickerOptionObj[]>(optionsList);
  const [selectedOptions, setSelectedOptions] =
    useState<SelectOptionsPickerOptionObj[]>(selectedOptionsList);
  const [selectedFormValue, setSelectedFormValue] = useState<string>("");

  const syncSelectedOptions = useCallback(
    (nextOptions: SelectOptionsPickerOptionObj[]) => {
      setSelectedOptions(nextOptions);
      if (setStateSelectedOptions) {
        setStateSelectedOptions(nextOptions);
      }
    },
    [setStateSelectedOptions],
  );

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
        })),
      );
    } catch {}
  }, [selectOptionsUrl]);

  const addOption = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      if (selectedFormValue === "") {
        toast.error("יש לבחור אפשרות");
        return;
      }

      const optionName =
        selectOptions.find(
          (option) => String(option.value) === selectedFormValue,
        )?.text ?? "";

      const isOptionAlreadySelected = selectedOptions.some(
        (option) => String(option.value) === selectedFormValue,
      );
      if (isOptionAlreadySelected) {
        toast.error("האפשרות כבר קיימת ברשימה");
        return;
      }

      syncSelectedOptions(
        [
          ...selectedOptions,
          {
            value: selectedFormValue,
            text: optionName,
          },
        ].sort((left, right) => left.text.localeCompare(right.text)),
      );
    },
    [selectOptions, selectedFormValue, selectedOptions, syncSelectedOptions],
  );

  const deleteOption = useCallback(
    (index: number) => {
      syncSelectedOptions(
        selectedOptions.filter((_, currentIndex) => currentIndex !== index),
      );
    },
    [selectedOptions, syncSelectedOptions],
  );

  const optionsToDisplay = useMemo(
    () => (!isEdit ? selectedOptionsList : selectedOptions),
    [isEdit, selectedOptions, selectedOptionsList],
  );

  useEffect(() => {
    setSelectOptions(optionsList);
  }, [optionsList]);

  useEffect(() => {
    setSelectedOptions(selectedOptionsList);
  }, [selectedOptionsList]);

  useEffect(() => {
    getSelectOptions();
  }, [getSelectOptions]);

  return {
    selectOptions,
    selectedOptions,
    selectedFormValue,
    setSelectedFormValue,
    optionsToDisplay,
    addOption,
    deleteOption,
  };
}
