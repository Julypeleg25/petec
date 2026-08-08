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
        logger.error(
          "Clinica sync status reported an error",
          status.lastSyncError.message,
          {
            operation: "poll_clinica_sync_status",
            occurredAt: status.lastSyncError.occurredAt,
            errorName: status.lastSyncError.name,
          },
        );
        setErrorMessage(CLINICA_TEXTS.syncError);
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
      const result = await syncClinicaClients();
      lastHandledResultRef.current = result.syncedAt;
      wasSyncingRef.current = false;
      setIsSyncing(false);
      setSuccessMessage(CLINICA_TEXTS.syncSuccess(result.created, result.updated));
      await onSyncCompleted();
    } catch (error) {
      logger.error(
        "Clinica manual sync failed",
        error instanceof Error ? error.message : String(error),
        { operation: "sync_latest_20_clients" },
      );
      const syncIsStillRunning = await loadSyncStatus();
      wasSyncingRef.current = syncIsStillRunning === true;
      setErrorMessage((currentMessage) => currentMessage || CLINICA_TEXTS.syncError);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadSyncStatus, onSyncCompleted]);

  return {
    errorMessage,
    handleSync,
    isSyncing,
    successMessage,
  };
}
