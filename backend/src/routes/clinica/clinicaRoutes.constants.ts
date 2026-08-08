export const CLINICA_ROUTE_PATHS = {
    clients: "/clients",
    debugConfig: "/debug/config",
    syncClients: "/clients/sync",
    syncStatus: "/clients/sync/status",
    syncClient: "/clients/external/:externalPatientId/sync",
    clientByExternalPatientId: "/clients/external/:externalPatientId",
  } as const;
