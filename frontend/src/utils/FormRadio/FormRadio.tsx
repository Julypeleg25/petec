import { useId } from "react";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";

import { muiTheme } from "../../theme/muiTheme";
import "./FormRadio.css";

import { FormRadioProps } from "./FormRadio.types";

function FormRadio({
  labelText,
  className,
  optionValue,
  setOptionValue,
}: FormRadioProps) {
  const radiogroupId = useId();

  return (
    <div className={`form-radio-container ${className ?? ""}`.trim()}>
      {labelText && <label className="form-textarea-label">{labelText}</label>}
      <RadioGroup
        row
        className="form-radio"
        id={radiogroupId}
        value={optionValue === null ? "" : String(optionValue)}
        onChange={(e) => setOptionValue(e.target.value === "true")}
      >
        <FormControlLabel
          value="false"
          labelPlacement="start"
          control={
            <Radio
              size="small"
              sx={{ color: muiTheme.palette.primary.main }}
            />
          }
          label="כן"
        />
        <FormControlLabel
          value="true"
          labelPlacement="start"
          control={
            <Radio
              size="small"
              sx={{ color: muiTheme.palette.primary.main }}
            />
          }
          label="לא"
        />
      </RadioGroup>
    </div>
  );
}

export default FormRadio;
