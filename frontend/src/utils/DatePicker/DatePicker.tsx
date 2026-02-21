import { getFormattedDateFromDBdate } from "../FormattingUtil";
import "./DatePicker.css";

import { DatePickerProps } from "./DatePicker.types";

function DatePicker({
  labelText,
  name = "",
  placeholder = "",
  isRequired = false,
  state,
  setState,
  width,
  min,
  max,
  id,
  disabled,
  setStateParams,
  afterChange,
}: DatePickerProps) {
  return (
    <div className="form-input-container" style={{ width: width }}>
      {labelText && (
        <label className="form-input-label">
          {labelText}
          {isRequired && !placeholder ? " *" : ""}
        </label>
      )}
      <div className="date-picker-form-input">
        <div className="date-picker-value">
          {getFormattedDateFromDBdate(state)}
        </div>
        <input
          id={id}
          type={"date"}
          placeholder={placeholder + (isRequired ? " *" : "")}
          name={name}
          required={isRequired}
          value={state}
          onChange={(e) => {
            if (setState) {
              if (setStateParams) setState(e, setStateParams);
              else setState(e);
            }

            if (afterChange) afterChange(e.target.value);
          }}
          min={min}
          max={max}
          disabled={disabled !== undefined ? disabled : false}
        />
      </div>
    </div>
  );
}

export default DatePicker;
