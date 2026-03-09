import {
  getDateForInput,
  getFormattedDateFromDBdate,
} from "../DateFormattingUtil";
import "./DatePicker.css";

import { DatePickerProps } from "./DatePicker.types";

const toInputDateValue = (value?: string | Date | null): string => {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? getDateForInput(value) : "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const [datePart] = trimmedValue.split("T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const parsedDate = new Date(trimmedValue);
  if (!Number.isFinite(parsedDate.getTime())) {
    return "";
  }

  return getDateForInput(parsedDate);
};

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
          value={toInputDateValue(state)}
          onChange={(e) => {
            if (setState) {
              const params = setStateParams ?? name;
              setState(e.target.value, params, name);
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
