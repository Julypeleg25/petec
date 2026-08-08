import { Box } from "@mui/material";
import { LocalizationProvider, DatePicker as MuiDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/he";

import { muiTheme } from "../../theme/muiTheme";

import { DatePickerProps } from "./DatePicker.types";

const DB_DATE_FORMAT = "YYYY-MM-DD";
const DISPLAY_DATE_FORMAT = "DD/MM/YYYY";

const toDayjsValue = (value?: string | Date | null): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
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
    <Box className="form-input-container" sx={{ width }}>
      {labelText && (
        <label className="form-input-label">
          {labelText}
          {isRequired && !placeholder ? " *" : ""}
        </label>
      )}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="he">
        <MuiDatePicker
          value={toDayjsValue(state)}
          format={DISPLAY_DATE_FORMAT}
          minDate={min ? dayjs(min) : undefined}
          maxDate={max ? dayjs(max) : undefined}
          disabled={disabled !== undefined ? disabled : false}
          onChange={(nextValue) => {
            const nextDateString =
              nextValue && nextValue.isValid()
                ? nextValue.format(DB_DATE_FORMAT)
                : "";

            if (setState) {
              const params = setStateParams ?? name;
              setState(nextDateString, params, name);
            }

            if (afterChange) afterChange(nextDateString);
          }}
          slotProps={{
            textField: {
              id,
              name,
              required: isRequired,
              fullWidth: true,
              size: "small",
              sx: {
                mt: "0.5em",
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${muiTheme.shape.borderRadius}px`,
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}

export default DatePicker;
