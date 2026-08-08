import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "#b159cd",
      dark: "#8f3bac",
      light: "#cf91e1",
      contrastText: "#ffffff",
    },
    error: {
      main: "rgb(211, 2, 2)",
    },
    info: {
      main: "rgb(16, 16, 196)",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    divider: "#ead8f0",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Segoe UI", "Noto Sans Hebrew", Tahoma, Arial, sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        startIcon: {
          marginLeft: 8,
          marginRight: -4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid #ead8f0",
          boxShadow: "0 2px 8px rgba(177, 89, 205, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: "right",
          borderBottomColor: "#ead8f0",
        },
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});
