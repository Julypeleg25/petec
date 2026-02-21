import "./FormRadio.css";

import { FormRadioProps } from "./FormRadio.types";
function FormRadio({
  labelText,
  className,
  optionValue,
  setOptionValue,
}: FormRadioProps) {
  const radiogroupId = "radio-yes-" + Math.random() * 1000;

  return (
    <div className={`form-radio-container ${className}`}>
      {labelText && <label className="form-textarea-label">{labelText}</label>}
      <div className="form-radio" id={radiogroupId}>
        <label>כן</label>
        <input
          type="radio"
          name={radiogroupId}
          onChange={() => {
            setOptionValue(false);
          }}
          checked={optionValue === false}
        />
        <label>לא</label>
        <input
          type="radio"
          name={radiogroupId}
          onChange={() => {
            setOptionValue(true);
          }}
          checked={optionValue === true}
        />
      </div>
    </div>
  );
}

export default FormRadio;
