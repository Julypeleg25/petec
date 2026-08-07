import {
  Box,
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
  Tooltip,
} from "@mui/material";

import { MdPersonAddAlt, MdRefresh } from "react-icons/md";

import { CLINICA_COLORS, CLINICA_TEXTS } from "../constants/clinica.constants";
import { ClinicaClient } from "../types/clinicaClient.types";

const MAX_VISIBLE_PETS = 2;

type Props = {
  clients: ClinicaClient[];
  totalClients: number;
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  updatingClientId: string | null;
  onPageChange: (page: number) => void;
  onCreateCase: (client: ClinicaClient) => void;
  onUpdateClient: (client: ClinicaClient) => void;
};

type CreateCaseButtonProps = {
  client: ClinicaClient;
  onCreateCase: (client: ClinicaClient) => void;
};

const CreateCaseButton = ({ client, onCreateCase }: CreateCaseButtonProps) => (
  <Tooltip title={CLINICA_TEXTS.createCase}>
    <IconButton
      size="small"
      onClick={() => onCreateCase(client)}
      sx={{ color: CLINICA_COLORS.primary }}
    >
      <MdPersonAddAlt fontSize="small" />
    </IconButton>
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
        size="small"
        disabled={!client.externalPatientId || isUpdating}
        onClick={() => onUpdateClient(client)}
        sx={{ color: CLINICA_COLORS.primary }}
      >
        {isUpdating ? (
          <CircularProgress size={16} sx={{ color: CLINICA_COLORS.primary }} />
        ) : (
          <MdRefresh fontSize="small" />
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
  updatingClientId,
  onPageChange,
  onCreateCase,
  onUpdateClient,
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
