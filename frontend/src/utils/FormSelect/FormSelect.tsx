import { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import "./FormSelect.css";

import { FormSelectProps } from "./FormSelect.types";

function FormSelect({
  elements,
  getElementsFunc,
  icon,
  width,
  optionState,
  setOptionState,
  selectId,
  isRequired = false,
  afterSelect,
  labelText,
  disabled = false,
  isDescOrder = false,
  isOrdered = true,
  searchable = true,
}: FormSelectProps) {
  const [selectElements, setSelectElements] = useState(elements ?? []);
  const [internalOptionState, setInternalOptionState] = useState(
    optionState ?? "",
  );

  useEffect(() => {
    if (optionState !== undefined) {
      setInternalOptionState(optionState);
    }
  }, [optionState]);

  useEffect(() => {
    if (elements) {
      setSelectElements(elements);
    }
  }, [elements]);

  useEffect(() => {
    let isMounted = true;
    if (getElementsFunc) {
      getElementsFunc().then((elements) => {
        if (isMounted) {
          setSelectElements(elements);
        }
      }).catch(() => {

      });
    }
    return () => {
      isMounted = false;
    };
  }, [getElementsFunc]);

  const sortedElements = useMemo(() => {
    const sourceElements = elements ?? selectElements;
    return [...sourceElements].sort((a, b) => {
      if (!isOrdered) return 0;
      const textA = a?.text || "";
      const textB = b?.text || "";
      return isDescOrder
        ? textB.localeCompare(textA)
        : textA.localeCompare(textB);
    });
  }, [elements, isDescOrder, isOrdered, selectElements]);

  const selectedValue =
    optionState !== undefined ? optionState : internalOptionState;
  const selectedOptionText = useMemo(
    () =>
      sortedElements.find((element) => element.value === selectedValue)?.text ?? "",
    [selectedValue, sortedElements],
  );
  const selectedOption = useMemo(
    () => sortedElements.find((element) => element.value === selectedValue) ?? null,
    [selectedValue, sortedElements],
  );

  const selectOption = (value: string, text?: string) => {
    if (optionState === undefined) {
      setInternalOptionState(value);
    }
    setOptionState?.(value);
    afterSelect?.(value, text);
  };

  return (
    <div className="form-select" style={{ width: width }}>
      {icon && <span className="form-select-icon">{icon}</span>}
      {labelText && (
        <label className="form-select-label" htmlFor={selectId}>
          {labelText}
          {isRequired && (
            <span className="form-required-indicator" aria-hidden="true">
              {" *"}
            </span>
          )}
        </label>
      )}
      {searchable ? (
        <Autocomplete
          className="form-select-autocomplete"
          options={sortedElements}
          value={selectedOption}
          getOptionLabel={(option) => option.text}
          getOptionDisabled={(option) => option.isDisabled === true}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          onChange={(_event, option) =>
            selectOption(option?.value ?? "", option?.text)
          }
          disabled={disabled}
          disableClearable={isRequired}
          noOptionsText="לא נמצאו תוצאות"
          slotProps={{
            listbox: {
              className: "form-select-options",
              dir: "rtl",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              id={selectId}
              required={isRequired}
              title={selectedOptionText || undefined}
              placeholder="הקלדה לחיפוש..."
            />
          )}
        />
      ) : (
        <select
          className="form-select-control"
          id={selectId}
          value={selectedValue}
          onChange={(event) =>
            selectOption(
              event.target.value,
              event.target.selectedOptions[0].innerText,
            )
          }
          required={isRequired}
          disabled={disabled}
          title={selectedOptionText || undefined}
        >
          <option value={""} disabled={isRequired}></option>
          {sortedElements.map((element) => (
            <option
              key={element.value}
              value={element.value}
              disabled={element.isDisabled}
              title={element.text}
            >
              {element.text}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default FormSelect;
