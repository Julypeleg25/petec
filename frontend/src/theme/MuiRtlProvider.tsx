import { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./muiTheme";

export function MuiRtlProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
