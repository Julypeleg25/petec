import { Box, InputAdornment, TextField } from "@mui/material";
import { FaSearch } from "react-icons/fa";

import { muiTheme } from "../../theme/muiTheme";
import { SearchBarProps } from "./SearchBar.types";

function SearchBar({ placeholder, state, setState, onEnter }: SearchBarProps) {
  return (
    <Box
      className="search-input-container"
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        width: "60%",
        maxWidth: "100%",
        mt: "0.5em",
        "@media screen and (max-width: 700px)": {
          width: "100%",
        },
      }}
    >
      <TextField
        fullWidth
        placeholder={placeholder}
        value={state ?? ""}
        onChange={(e) => setState?.(e.target.value)}
        sx={{
          my: "0.5em",
          "@media screen and (max-width: 700px)": {
            my: "0.25em",
          },
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            transition: "box-shadow 0.15s ease, border-color 0.15s ease",
            "& fieldset": {
              borderWidth: 2,
              borderColor: muiTheme.palette.divider,
            },
            "&:hover fieldset": {
              borderColor: muiTheme.palette.primary.light,
            },
            "&.Mui-focused": {
              boxShadow: `0 2px 10px ${muiTheme.palette.primary.main}26`,
            },
            "&.Mui-focused fieldset": {
              borderColor: muiTheme.palette.primary.main,
            },
          },
          "& input": {
            textAlign: "right",
            fontSize: "1rem",
          },
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: `${muiTheme.palette.primary.main}1a`,
                  }}
                >
                  <FaSearch color={muiTheme.palette.primary.main} size={15} />
                </Box>
              </InputAdornment>
            ),
          },
          htmlInput: {
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                onEnter?.(e);
              }
            },
          },
        }}
      />
    </Box>
  );
}

export default SearchBar;
