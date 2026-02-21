import { useEffect, useState } from "react";
import "./FormSelect.css";

import { SelectOptionObj, FormSelectProps } from "./FormSelect.types";

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
  const [selectElements, setSelectElements] = useState(elements);

  useEffect(() => {
    if (getElementsFunc) {
      getElementsFunc().then((elements) => {
        setSelectElements(elements);
      });
    }
  }, []);

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
        value={optionState}
        onChange={(e) => {
          if (setOptionState) setOptionState(e.target.value);
          if (afterSelect)
            afterSelect(e.target.value, e.target.selectedOptions[0].innerText);
        }}
        required={isRequired}
        disabled={disabled}
      >
        <option value={""} disabled={isRequired} selected></option>
        {elements
          ? elements
              .sort((a: any, b: any) => {
                if (!isOrdered) return 0;
                const textA = a?.text || "";
                const textB = b?.text || "";
                return isDescOrder
                  ? textB.localeCompare(textA)
                  : textA.localeCompare(textB);
              })
              .map((element, i) => {
                return (
                  <option key={i} value={element.value}>
                    {element.text}
                  </option>
                );
              })
          : selectElements
              ?.sort((a: any, b: any) => {
                if (!isOrdered) return 0;
                const textA = a?.text || "";
                const textB = b?.text || "";
                return isDescOrder
                  ? textB.localeCompare(textA)
                  : textA.localeCompare(textB);
              })
              .map((element, i) => {
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
