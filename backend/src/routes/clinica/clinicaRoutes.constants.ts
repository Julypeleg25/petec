export const CLINICA_ROUTE_PATHS = {
    clients: "/clients",
    debugConfig: "/debug/config",
    syncClients: "/clients/sync",
    syncStatus: "/clients/sync/status",
    clientByExternalPatientId: "/clients/external/:externalPatientId",
    clientByCasePrefix: "/clients/match/case-prefix",
    cachedPet: "/clients/:clientId/pets/cached",
    fetchPetVisits: "/clients/:clientId/pets/visits/fetch",
    fetchCaseVisits: "/clients/visits/fetch-by-case",
  } as const;
