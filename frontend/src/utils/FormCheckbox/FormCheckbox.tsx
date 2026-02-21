import "./FormCheckbox.css";

import { FormCheckboxProps } from "./FormCheckbox.types";

function FormCheckbox({
  checked,
  setChecked,
  labelText,
  disabled = false,
  afterChange,
}: FormCheckboxProps) {
  return (
    <div className="form-checkbox-container">
      {labelText && <label>{labelText}</label>}
      <input
        checked={checked}
        type={"checkbox"}
        onChange={(e) => {
          setChecked(e.target.checked);
          if (afterChange) afterChange(e.target.checked);
        }}
        disabled={disabled}
      ></input>
    </div>
  );
}

export default FormCheckbox;
