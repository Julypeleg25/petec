import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

import { MdPersonAddAlt } from "react-icons/md";

import { CLINICA_COLORS, CLINICA_TEXTS } from "../constants/clinica.constants";
import { ClinicaClient } from "../types/clinicaClient.types";
import { getClinicaPetKey } from "../utils/clinicaPet.utils";

type Props = {
  clients: ClinicaClient[];
  totalClients: number;
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  isCreateCaseDisabled?: boolean;
  creatingClientId?: string;
  onPageChange: (page: number) => void;
  onCreateCase: (client: ClinicaClient) => void;
};

type CreateCaseButtonProps = {
  client: ClinicaClient;
  onCreateCase: (client: ClinicaClient) => void;
  compact?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
};

const CreateCaseButton = ({
  client,
  onCreateCase,
  compact = false,
  disabled = false,
  isLoading = false,
}: CreateCaseButtonProps) => (
  <Button
    size="small"
    variant="outlined"
    onClick={() => onCreateCase(client)}
    disabled={disabled || client.pets.length === 0}
    sx={{
      minWidth: compact ? 132 : 168,
      px: compact ? 1.5 : 2.5,
      py: 0.65,
      justifyContent: "center",
      whiteSpace: "nowrap",
    }}
  >
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        direction: "rtl",
        whiteSpace: "nowrap",
      }}
    >
      {isLoading ? (
        <CircularProgress size={17} color="inherit" />
      ) : (
        <MdPersonAddAlt fontSize="small" />
      )}
      <span>{isLoading ? CLINICA_TEXTS.openingCase : CLINICA_TEXTS.createCase}</span>
    </Box>
  </Button>
);

export const ClinicaClientsTable = ({
  clients,
  totalClients,
  page,
  rowsPerPage,
  isLoading,
  isCreateCaseDisabled = false,
  creatingClientId,
  onPageChange,
  onCreateCase,
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
                      <Box sx={{ display: { xs: "block", md: "none" } }}>
                        <CreateCaseButton
                          client={client}
                          onCreateCase={onCreateCase}
                          disabled={isCreateCaseDisabled}
                          isLoading={creatingClientId === client._id}
                          compact
                        />
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>{client.ownerName}</TableCell>

                  <TableCell>{client.ownerPhone}</TableCell>

                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        direction: "rtl",
                      }}
                    >
                      {client.pets.length > 0 ? (
                        client.pets.map((pet, index) => (
                          <Chip
                            key={`${getClinicaPetKey(client, pet)}:${index}`}
                            label={pet.name}
                            size="small"
                          />
                        ))
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
                    <CreateCaseButton
                      client={client}
                      onCreateCase={onCreateCase}
                      disabled={isCreateCaseDisabled}
                      isLoading={creatingClientId === client._id}
                    />
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
        disabled={isLoading}
        onPageChange={(_event, nextPage) => onPageChange(nextPage)}
        labelDisplayedRows={({ from, to, count }) =>
          CLINICA_TEXTS.paginationRows(from, to, count)
        }
      />
    </>
  );
};
