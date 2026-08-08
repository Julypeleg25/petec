import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { MdPersonAddAlt, MdRefresh, MdSearch } from "react-icons/md";

import { CLINICA_COLORS, CLINICA_TEXTS } from "../constants/clinica.constants";
import { useClinicaManualClientSync } from "../hooks/useClinicaManualClientSync";
import { ClinicaClient } from "../types/clinicaClient.types";

const MAX_VISIBLE_PETS = 2;

type Props = {
  clients: ClinicaClient[];
  totalClients: number;
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  search: string;
  updatingClientId: string | null;
  onPageChange: (page: number) => void;
  onCreateCase: (client: ClinicaClient) => void;
  onUpdateClient: (client: ClinicaClient) => void;
  onManualSyncCompleted: (client: ClinicaClient) => void;
};

const ManualClientSync = ({
  clientId,
  onManualSyncCompleted,
}: {
  clientId: string;
  onManualSyncCompleted: (client: ClinicaClient) => void;
}) => {
  const manualSync = useClinicaManualClientSync({
    onSynced: onManualSyncCompleted,
    initialClientId: clientId,
  });

  return (
    <Stack spacing={1.25} sx={{ alignItems: "center", mt: 1.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: "center", direction: "rtl", width: "100%", maxWidth: 520 }}
      >
        <TextField
          fullWidth
          size="small"
          value={manualSync.value}
          label={CLINICA_TEXTS.manualSyncPlaceholder}
          helperText={CLINICA_TEXTS.manualSyncIdOnlyHint}
          disabled={manualSync.isSubmitting}
          onChange={(event) => manualSync.setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void manualSync.submit();
          }}
          slotProps={{
            htmlInput: {
              dir: "ltr",
              inputMode: "numeric",
              pattern: "[0-9]*",
              readOnly: true,
            },
          }}
        />
        <Button
          variant="contained"
          disabled={manualSync.isSubmitting || !manualSync.value}
          onClick={() => void manualSync.submit()}
          startIcon={manualSync.isSubmitting ? <CircularProgress size={18} color="inherit" /> : <MdSearch />}
          sx={{ borderRadius: 999, minWidth: 170, height: 40 }}
        >
          {manualSync.isSubmitting
            ? CLINICA_TEXTS.prefillSearchLoading
            : CLINICA_TEXTS.manualSyncSubmit}
        </Button>
      </Stack>

      {manualSync.errorMessage && (
        <Typography variant="body2" color="error">
          {manualSync.errorMessage}
        </Typography>
      )}
      {manualSync.successMessage && (
        <Typography variant="body2" color="success.main">
          {manualSync.successMessage}
        </Typography>
      )}
    </Stack>
  );
};

type CreateCaseButtonProps = {
  client: ClinicaClient;
  onCreateCase: (client: ClinicaClient) => void;
};

const CreateCaseButton = ({ client, onCreateCase }: CreateCaseButtonProps) => (
  <Tooltip title={CLINICA_TEXTS.createCase}>
    <span>
      <IconButton
        size="medium"
        disabled={client.pets.length === 0}
        onClick={() => onCreateCase(client)}
        sx={{ color: CLINICA_COLORS.primary, fontSize: "1.6rem" }}
      >
        <MdPersonAddAlt fontSize="inherit" />
      </IconButton>
    </span>
  </Tooltip>
);

type UpdateClientButtonProps = {
  client: ClinicaClient;
  isUpdating: boolean;
  onUpdateClient: (client: ClinicaClient) => void;
};

const UpdateClientButton = ({
  client,
  isUpdating,
  onUpdateClient,
}: UpdateClientButtonProps) => (
  <Tooltip title={CLINICA_TEXTS.updateClient}>
    <span>
      <IconButton
        size="medium"
        disabled={!client.externalPatientId || isUpdating}
        onClick={() => onUpdateClient(client)}
        sx={{ color: CLINICA_COLORS.primary, fontSize: "1.6rem" }}
      >
        {isUpdating ? (
          <CircularProgress size={22} sx={{ color: CLINICA_COLORS.primary }} />
        ) : (
          <MdRefresh fontSize="inherit" />
        )}
      </IconButton>
    </span>
  </Tooltip>
);

export const ClinicaClientsTable = ({
  clients,
  totalClients,
  page,
  rowsPerPage,
  isLoading,
  search,
  updatingClientId,
  onPageChange,
  onCreateCase,
  onUpdateClient,
  onManualSyncCompleted,
}: Props) => {
  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        dir="rtl"
        sx={{
          overflowX: "auto",
          direction: "rtl",
        }}
      >
        <Table
          dir="rtl"
          sx={{
            minWidth: { xs: 760, md: 1180 },
            tableLayout: "fixed",
            direction: "rtl",
            "& th, & td": {
              textAlign: "right",
              verticalAlign: "middle",
              px: { xs: 2, md: 3 },
              py: 2.25,
            },
            "& th": {
              whiteSpace: "nowrap",
              fontSize: "1rem",
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                bgcolor: CLINICA_COLORS.primarySoft,
              }}
            >
              <TableCell sx={{ width: { xs: 190, md: 220 }, pr: 4 }}>
                {CLINICA_TEXTS.table.clinicaCaseId}
              </TableCell>

              <TableCell sx={{ width: 240 }}>
                {CLINICA_TEXTS.table.ownerName}
              </TableCell>

              <TableCell sx={{ width: 170 }}>
                {CLINICA_TEXTS.table.phone}
              </TableCell>

              <TableCell sx={{ width: 210 }}>
                {CLINICA_TEXTS.table.pets}
              </TableCell>

              <TableCell sx={{ width: 220 }}>
                {CLINICA_TEXTS.table.lastSync}
              </TableCell>

              <TableCell
                sx={{
                  width: 210,
                  pl: 4,
                  display: { xs: "none", md: "table-cell" },
                }}
              >
                {CLINICA_TEXTS.table.action}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell sx={{ pr: 4 }}>
                    <Stack spacing={1.25} sx={{ alignItems: "flex-start" }}>
                      <Box>{client.externalPatientId || "-"}</Box>
                      <Stack
                        direction="row"
                        spacing={3}
                        sx={{
                          alignItems: "center",
                          direction: "rtl",
                          display: { xs: "flex", md: "none" },
                        }}
                      >
                        <CreateCaseButton
                          client={client}
                          onCreateCase={onCreateCase}
                        />
                        <UpdateClientButton
                          client={client}
                          isUpdating={updatingClientId === client.externalPatientId}
                          onUpdateClient={onUpdateClient}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell>{client.ownerName}</TableCell>

                  <TableCell>{client.ownerPhone}</TableCell>

                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                        flexWrap: "nowrap",
                        gap: 1,
                        direction: "rtl",
                        overflow: "hidden",
                        minWidth: 0,
                      }}
                    >
                      {client.pets.length > 0 ? (
                        <>
                          {client.pets.slice(0, MAX_VISIBLE_PETS).map((pet, index) => (
                            <Chip
                              key={`${pet.name}-${index}`}
                              label={pet.name}
                              size="small"
                              sx={{
                                maxWidth: 86,
                                "& .MuiChip-label": {
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          ))}

                          {client.pets.length > MAX_VISIBLE_PETS && (
                            <Tooltip
                              title={client.pets
                                .slice(MAX_VISIBLE_PETS)
                                .map((pet) => pet.name)
                                .join(", ")}
                              placement="top"
                              arrow
                            >
                              <Chip
                                label={`+${client.pets.length - MAX_VISIBLE_PETS}`}
                                size="small"
                                variant="outlined"
                                sx={{ flexShrink: 0, fontWeight: 700 }}
                              />
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <>-</>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(client.lastSyncedAt).toLocaleString("he-IL")}
                  </TableCell>

                  <TableCell
                    sx={{
                      pl: 4,
                      display: { xs: "none", md: "table-cell" },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={3}
                      sx={{ alignItems: "center", direction: "rtl" }}
                    >
                      <CreateCaseButton
                        client={client}
                        onCreateCase={onCreateCase}
                      />
                      <UpdateClientButton
                        client={client}
                        isUpdating={updatingClientId === client.externalPatientId}
                        onUpdateClient={onUpdateClient}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {CLINICA_TEXTS.noClients}
                  {/^\d+$/.test(search.trim()) && (
                    <ManualClientSync
                      clientId={search.trim()}
                      onManualSyncCompleted={onManualSyncCompleted}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalClients}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        onPageChange={(_event, nextPage) => onPageChange(nextPage)}
        labelDisplayedRows={({ from, to, count }) =>
          CLINICA_TEXTS.paginationRows(from, to, count)
        }
      />
    </>
  );
};
