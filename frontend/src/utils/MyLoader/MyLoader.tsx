import { Box, CircularProgress } from "@mui/material";

import { muiTheme } from "../../theme/muiTheme";
import { MyLoaderProps } from "./MyLoader.types";

function MyLoader({ size = "70" }: MyLoaderProps) {
  return (
    <Box
      className="MyLoader"
      sx={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <CircularProgress
        size={Number(size)}
        thickness={3}
        sx={{ color: muiTheme.palette.primary.main }}
        aria-label="rotating-lines-loading"
      />
    </Box>
  );
}

export default MyLoader;
