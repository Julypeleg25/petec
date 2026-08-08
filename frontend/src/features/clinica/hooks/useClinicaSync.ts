import { useCallback, useEffect, useRef, useState } from "react";
import {
  getClinicaSyncStatus,
  syncClinicaClients,
} from "../api/clinica.api";
import {
  CLINICA_SYNC_STATUS_POLL_MS,
  CLINICA_TEXTS,
} from "../constants/clinica.constants";
import { logger } from "../../../lib/logger";

type UseClinicaSyncParams = {
  onSyncCompleted: () => Promise<void> | void;
};

export function useClinicaSync({ onSyncCompleted }: UseClinicaSyncParams) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const wasSyncingRef = useRef(false);
  const lastHandledResultRef = useRef<string | null>(null);
  const statusRequestRunningRef = useRef(false);

  const loadSyncStatus = useCallback(async () => {
    if (statusRequestRunningRef.current) return null;
    statusRequestRunningRef.current = true;
    try {
      const status = await getClinicaSyncStatus();
      const syncJustCompleted = wasSyncingRef.current && !status.isSyncRunning;
      wasSyncingRef.current = status.isSyncRunning;
      setIsSyncing(status.isSyncRunning);
      if (status.isSyncRunning) {
        setErrorMessage("");
        setSuccessMessage("");
      } else if (status.lastSyncError?.message) {
        setErrorMessage(status.lastSyncError.message);
      }
      if (syncJustCompleted && !status.lastSyncError) {
        const result = status.lastSyncResult;
        if (result && lastHandledResultRef.current !== result.syncedAt) {
          lastHandledResultRef.current = result.syncedAt;
          setSuccessMessage(CLINICA_TEXTS.syncSuccess(result.created, result.updated));
        }
        await onSyncCompleted();
      }
      return status.isSyncRunning;
    } catch {
      return null;
    } finally {
      statusRequestRunningRef.current = false;
    }
  }, [onSyncCompleted]);

  useEffect(() => {
    loadSyncStatus();
    const intervalId = window.setInterval(
      loadSyncStatus,
      CLINICA_SYNC_STATUS_POLL_MS,
    );

    return () => window.clearInterval(intervalId);
  }, [loadSyncStatus]);

  const handleSync = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    wasSyncingRef.current = true;
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const status = await syncClinicaClients();
      wasSyncingRef.current = status.isSyncRunning;
      setIsSyncing(status.isSyncRunning);
    } catch (error) {
      logger.error(
        "Clinica manual sync failed",
        error instanceof Error ? error.message : String(error),
      );
      const syncIsStillRunning = await loadSyncStatus();
      wasSyncingRef.current = syncIsStillRunning === true;
      setErrorMessage((currentMessage) => currentMessage || CLINICA_TEXTS.syncError);
    }
  }, [isSyncing, loadSyncStatus, onSyncCompleted]);

  return {
    errorMessage,
    handleSync,
    isSyncing,
    successMessage,
  };
}
