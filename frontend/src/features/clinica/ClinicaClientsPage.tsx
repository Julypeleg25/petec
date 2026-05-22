import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import { AppRoutes } from "../../config/appRoutes";
import { MuiRtlProvider } from "../../theme/MuiRtlProvider";
import {
  CLINICA_COLORS,
  CLINICA_TEXTS,
} from "./constants/clinica.constants";
import { ClinicaClientsControls } from "./components/ClinicaClientsControls";
import { ClinicaClientsTable } from "./components/ClinicaClientsTable";
import { ClinicaPetSelectionDialog } from "./components/ClinicaPetSelectionDialog";
import { useClinicaClients } from "./hooks/useClinicaClients";
import { useClinicaSync } from "./hooks/useClinicaSync";
import { mapClinicaClientToNewPatientState } from "./mappers/clinicaClientToNewPatient.mapper";
import type { ClinicaClient, ClinicaPet } from "./types/clinicaClient.types";

const ClinicaClientsPageContent = () => {
  const navigate = useNavigate();
  const [clientForPetSelection, setClientForPetSelection] =
    useState<ClinicaClient | null>(null);
  const {
    clients,
    errorMessage: clientsErrorMessage,
    handleSearchChange,
    isLoading,
    loadClients,
    page,
    rowsPerPage,
    search,
    setPage,
    totalClients,
  } = useClinicaClients();
  const {
    errorMessage: syncErrorMessage,
    handleSync,
    isSyncing,
    successMessage,
  } = useClinicaSync({ onSyncCompleted: loadClients });

  const openNewPatientPage = useCallback(
    (client: ClinicaClient, pet: ClinicaPet) => {
      navigate(AppRoutes.Patients.NewPatient, {
        state: mapClinicaClientToNewPatientState(client, pet),
      });
    },
    [navigate],
  );

  const handleCreateCase = useCallback(
    (client: ClinicaClient) => {
      if (client.pets.length <= 1) {
        openNewPatientPage(client, client.pets[0] ?? { name: "" });
        return;
      }

      setClientForPetSelection(client);
    },
    [openNewPatientPage],
  );

  const handlePetSelected = useCallback(
    (pet: ClinicaPet) => {
      if (!clientForPetSelection) {
        return;
      }

      openNewPatientPage(clientForPetSelection, pet);
      setClientForPetSelection(null);
    },
    [clientForPetSelection, openNewPatientPage],
  );

  const errorMessage = clientsErrorMessage || syncErrorMessage;

  return (
    <Box
      dir="rtl"
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        minHeight: "100%",
      }}
    >
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            bgcolor: CLINICA_COLORS.primarySoft,
            border: `1px solid ${CLINICA_COLORS.border}`,
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 2 },
            textAlign: "right",
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              color: "text.primary",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {CLINICA_TEXTS.pageTitle}
          </Typography>
        </Box>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <ClinicaClientsControls
          search={search}
          isSyncing={isSyncing}
          onSearchChange={handleSearchChange}
          onSync={handleSync}
        />

        <Card
          variant="outlined"
          sx={{
            bgcolor: "background.paper",
            borderColor: CLINICA_COLORS.border,
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              sx={{
                mb: 3,
                alignItems: "center",
                gap: 2.5,
                justifyContent: "flex-start",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {CLINICA_TEXTS.clientsTitle}
              </Typography>

              <Chip
                label={CLINICA_TEXTS.clientsCount(totalClients)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  px: 0.75,
                  fontSize: "0.95rem",
                }}
              />
            </Stack>

            <ClinicaClientsTable
              clients={clients}
              totalClients={totalClients}
              page={page}
              rowsPerPage={rowsPerPage}
              isLoading={isLoading}
              onPageChange={setPage}
              onCreateCase={handleCreateCase}
            />
          </CardContent>
        </Card>
      </Stack>

      <ClinicaPetSelectionDialog
        client={clientForPetSelection}
        onClose={() => setClientForPetSelection(null)}
        onPetSelected={handlePetSelected}
      />
    </Box>
  );
};

const ClinicaClientsPage = () => (
  <MuiRtlProvider>
    <ClinicaClientsPageContent />
  </MuiRtlProvider>
);

export default ClinicaClientsPage;
