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
  
  import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
  
  import { CLINICA_COLORS, CLINICA_TEXTS } from "../constants/clinica.constants";
  import { ClinicaClient } from "../types/clinicaClient.types";
  
  type Props = {
    clients: ClinicaClient[];
    totalClients: number;
    page: number;
    rowsPerPage: number;
    isLoading: boolean;
    onPageChange: (
      page: number,
    ) => void;
    onCreateCase: (
      client: ClinicaClient,
    ) => void;
  };
  
  export const ClinicaClientsTable = ({
    clients,
    totalClients,
    page,
    rowsPerPage,
    isLoading,
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
              minWidth: 1180,
              tableLayout: "fixed",
              direction: "rtl",
              "& th, & td": {
                textAlign: "right",
                verticalAlign: "middle",
                px: 3,
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
                <TableCell sx={{ width: 190, pr: 4 }}>
                  {CLINICA_TEXTS.table.clinicaCaseId}
                </TableCell>
  
                <TableCell sx={{ width: 250 }}>
                  {CLINICA_TEXTS.table.ownerName}
                </TableCell>
  
                <TableCell sx={{ width: 180 }}>
                  {CLINICA_TEXTS.table.phone}
                </TableCell>
  
                <TableCell sx={{ width: 220 }}>
                  {CLINICA_TEXTS.table.pets}
                </TableCell>
  
                <TableCell sx={{ width: 230 }}>
                  {CLINICA_TEXTS.table.lastSync}
                </TableCell>
  
                <TableCell sx={{ width: 210, pl: 4 }}>
                  {CLINICA_TEXTS.table.action}
                </TableCell>
              </TableRow>
            </TableHead>
  
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    <CircularProgress
                      size={28}
                    />
                  </TableCell>
                </TableRow>
              )}
  
              {!isLoading &&
                clients.map((client) => (
                  <TableRow
                    key={client._id}
                    hover
                  >
                    <TableCell sx={{ pr: 4 }}>
                      {client.externalPatientId ||
                        "-"}
                    </TableCell>
  
                    <TableCell>
                      {client.ownerName}
                    </TableCell>
  
                    <TableCell>
                      {client.ownerPhone}
                    </TableCell>
  
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
                        {client.pets.length >
                        0 ? (
                          client.pets.map(
                            (pet) => (
                              <Chip
                                key={pet.name}
                                label={
                                  pet.name
                                }
                                size="small"
                              />
                            ),
                          )
                        ) : (
                          <>-</>
                        )}
                      </Stack>
                    </TableCell>
  
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(
                        client.lastSyncedAt,
                      ).toLocaleString(
                        "he-IL",
                      )}
                    </TableCell>
  
                    <TableCell sx={{ pl: 4 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          onCreateCase(
                            client,
                          )
                        }
                        sx={{
                          minWidth: 168,
                          px: 2.5,
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
                            gap: 1.25,
                            direction: "rtl",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <PersonAddAltIcon fontSize="small" />
                          <span>{CLINICA_TEXTS.createCase}</span>
                        </Box>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
  
              {!isLoading &&
                clients.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                    >
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
          rowsPerPageOptions={[
            rowsPerPage,
          ]}
          onPageChange={(
            _event,
            nextPage,
          ) =>
            onPageChange(nextPage)
          }
          labelDisplayedRows={({
            from,
            to,
                count,
          }) =>
            CLINICA_TEXTS.paginationRows(from, to, count)
          }
        />
      </>
    );
  };        
