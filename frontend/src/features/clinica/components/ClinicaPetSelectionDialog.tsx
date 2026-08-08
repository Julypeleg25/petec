import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import { getClinicaPetKey } from "../utils/clinicaPet.utils";

type ClinicaPetSelectionDialogProps = {
  client: ClinicaClient | null;
  errorMessage?: string;
  hydratingPetKey?: string;
  onClose: () => void;
  onPetSelected: (pet: ClinicaPet) => void;
};

export const ClinicaPetSelectionDialog = ({
  client,
  errorMessage,
  hydratingPetKey,
  onClose,
  onPetSelected,
}: ClinicaPetSelectionDialogProps) => (
  <Dialog
    open={Boolean(client)}
    onClose={hydratingPetKey ? undefined : onClose}
    fullWidth
    maxWidth="xs"
    dir="rtl"
  >
    <DialogTitle>{CLINICA_TEXTS.choosePetTitle}</DialogTitle>
    <DialogContent>
      <Stack spacing={1.5}>
        <Typography color="text.secondary">
          {CLINICA_TEXTS.choosePetDescription}
        </Typography>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {client?.pets.map((pet, index) => {
          const petKey = getClinicaPetKey(client, pet);
          const isHydrating = hydratingPetKey === petKey;
          return (
            <Button
              key={`${petKey}:${index}`}
              variant="outlined"
              onClick={() => onPetSelected(pet)}
              disabled={Boolean(hydratingPetKey)}
              sx={{
                justifyContent: "flex-start",
                borderRadius: 999,
              }}
            >
              {isHydrating && <CircularProgress size={17} sx={{ ml: 1 }} />}
              {isHydrating ? CLINICA_TEXTS.openingCase : pet.name}
            </Button>
          );
        })}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={Boolean(hydratingPetKey)}>
        {CLINICA_TEXTS.cancel}
      </Button>
    </DialogActions>
  </Dialog>
);
