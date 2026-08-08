import { Box, Checkbox, FormControlLabel } from "@mui/material";

import { muiTheme } from "../../theme/muiTheme";
import { FormCheckboxProps } from "./FormCheckbox.types";

function FormCheckbox({
  checked,
  setChecked,
  labelText,
  disabled = false,
  afterChange,
}: FormCheckboxProps) {
  return (
    <Box
      className="form-checkbox-container"
      sx={{
        width: "80%",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "flex-end",
        mt: "0.8em",
        mb: "0.5em",
        mr: "0.5em",
        fontSize: "1.1rem",
        "@media screen and (max-width: 700px)": {
          width: "100%",
          mr: 0,
          fontSize: "1rem",
        },
      }}
    >
      <FormControlLabel
        label={labelText ?? ""}
        labelPlacement="start"
        disabled={disabled}
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              if (afterChange) afterChange(e.target.checked);
            }}
            sx={{
              color: muiTheme.palette.primary.main,
              "&.Mui-checked": {
                color: muiTheme.palette.primary.main,
              },
              "& .MuiSvgIcon-root": {
                fontSize: 20,
              },
            }}
          />
        }
        sx={{
          ml: 0,
          "& .MuiFormControlLabel-label": {
            fontSize: "inherit",
          },
        }}
      />
    </Box>
  );
}

export default FormCheckbox;
