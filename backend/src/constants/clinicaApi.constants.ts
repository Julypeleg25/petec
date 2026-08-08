export const CLINICA_API_PATHS = {
  newPatients: "/Restricted/dbCalander.asmx/GetNewPatientsVisited",
  lastPatients: "/Restricted/dbCalander.asmx/GetLastPatients",
  pets: "/Restricted/dbCalander.asmx/GetPetsNames",
  petDetails: "/Restricted/dbCalander.asmx/LoadPetDetails",
  petSessions: "/Restricted/dbCalander.asmx/LoadPetSessions",
} as const;

export const CLINICA_LAST_PATIENTS_PAYLOAD = {
  move: 0,
  fromDate: "",
} as const;

export const CLINICA_LATEST_CLIENT_LIMIT = 20;
export const CLINICA_PAGE_TIMEOUT_MS = 15_000;
export const CLINICA_NAVIGATION_TIMEOUT_MS = 60_000;

