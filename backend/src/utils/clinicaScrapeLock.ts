type ClinicaScrapeLockOwner =
  | "daily-sync"
  | "single-client-sync"
  | "pet-sessions";

let currentOwner: ClinicaScrapeLockOwner | null = null;

export const isClinicaScrapeLocked = (): boolean => currentOwner !== null;

export const getClinicaScrapeLockOwner = (): ClinicaScrapeLockOwner | null =>
  currentOwner;

export const acquireClinicaScrapeLock = (
  owner: ClinicaScrapeLockOwner,
): boolean => {
  if (currentOwner !== null) {
    return false;
  }

  currentOwner = owner;

  return true;
};

export const releaseClinicaScrapeLock = (
  owner: ClinicaScrapeLockOwner,
): void => {
  if (currentOwner === owner) {
    currentOwner = null;
  }
};
