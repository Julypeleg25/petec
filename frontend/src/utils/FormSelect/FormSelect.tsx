import { useEffect, useMemo, useState } from "react";
import "./FormSelect.css";

import { FormSelectProps } from "./FormSelect.types";

export const getSelectedText = (id: string) => {
  const element = document.getElementById(id) as HTMLSelectElement;
  return element?.options[element?.selectedIndex].text;
};

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
        // handled by interceptor
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

  return (
    <div className="form-select" style={{ width: width }}>
      {icon && <span className="form-select-icon">{icon}</span>}
      {labelText && (
        <label className="form-select-label" htmlFor={selectId}>
          {labelText} {isRequired ? "* " : ""}
        </label>
      )}
      <select
        id={selectId}
        value={selectedValue}
        onChange={(e) => {
          if (optionState === undefined) {
            setInternalOptionState(e.target.value);
          }
          if (setOptionState) setOptionState(e.target.value);
          if (afterSelect)
            afterSelect(e.target.value, e.target.selectedOptions[0].innerText);
        }}
        required={isRequired}
        disabled={disabled}
      >
        <option value={""} disabled={isRequired}></option>
        {sortedElements.map((element, i) => {
          return (
            <option key={i} value={element.value}>
              {element.text}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default FormSelect;
