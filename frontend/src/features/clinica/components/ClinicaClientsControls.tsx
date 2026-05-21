import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";

import { CLINICA_COLORS, CLINICA_TEXTS } from "../constants/clinica.constants";

type ClinicaClientsControlsProps = {
  search: string;
  isSyncing: boolean;
  onSearchChange: (value: string) => void;
  onSync: () => void;
};

export const ClinicaClientsControls = ({
  search,
  isSyncing,
  onSearchChange,
  onSync,
}: ClinicaClientsControlsProps) => (
  <Card
    variant="outlined"
    sx={{
      bgcolor: CLINICA_COLORS.primaryFaint,
      borderColor: CLINICA_COLORS.border,
    }}
  >
    <CardContent
      sx={{
        p: { xs: 2, md: 3 },
        "&:last-child": {
          pb: { xs: 2, md: 3 },
        },
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        sx={{
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          justifyContent: "space-between",
          gap: {
            xs: 1.5,
            md: 3,
          },
        }}
      >
        <TextField
          fullWidth
          sx={{ flex: 1 }}
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          placeholder={CLINICA_TEXTS.searchPlaceholder}
          size="small"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            },
            htmlInput: {
              dir: "rtl",
            },
          }}
        />

        <Button
          variant="contained"
          disabled={isSyncing}
          onClick={onSync}
          sx={{
            minWidth: {
              xs: "100%",
              md: 220,
            },
            height: 44,
            borderRadius: 999,
            boxShadow: CLINICA_COLORS.shadow,
            alignSelf: {
              xs: "stretch",
              md: "center",
            },
          }}
        >
          <Stack
            component="span"
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {isSyncing ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SyncIcon fontSize="small" />
            )}
            <span>
              {isSyncing ? CLINICA_TEXTS.syncing : CLINICA_TEXTS.manualSync}
            </span>
          </Stack>
        </Button>
      </Stack>
    </CardContent>
  </Card>
);
