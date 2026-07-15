import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";

type ClinicaPetSelectionDialogProps = {
  client: ClinicaClient | null;
  onClose: () => void;
  onPetSelected: (pet: ClinicaPet) => void;
};

export const ClinicaPetSelectionDialog = ({
  client,
  onClose,
  onPetSelected,
}: ClinicaPetSelectionDialogProps) => (
  <Dialog open={Boolean(client)} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
    <DialogTitle>{CLINICA_TEXTS.choosePetTitle}</DialogTitle>
    <DialogContent>
      <Stack spacing={1.5}>
        <Typography color="text.secondary">
          {CLINICA_TEXTS.choosePetDescription}
        </Typography>
        {client?.pets.map((pet) => (
          <Button
            key={pet.name}
            variant="outlined"
            onClick={() => onPetSelected(pet)}
            sx={{
              justifyContent: "flex-start",
              borderRadius: 999,
            }}
          >
            {pet.name}
          </Button>
        ))}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>{CLINICA_TEXTS.cancel}</Button>
    </DialogActions>
  </Dialog>
);
