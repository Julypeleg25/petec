import { useCallback, useEffect, useState } from "react";
import {
  getClinicaSyncStatus,
  syncClinicaClients,
} from "../api/clinica.api";
import {
  CLINICA_SYNC_STATUS_POLL_MS,
  CLINICA_TEXTS,
} from "../constants/clinica.constants";

type UseClinicaSyncParams = {
  onSyncCompleted: () => Promise<void> | void;
};

export function useClinicaSync({ onSyncCompleted }: UseClinicaSyncParams) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await getClinicaSyncStatus();
      setIsSyncing(status.isSyncRunning);
    } catch {}
  }, []);

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
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result = await syncClinicaClients();
      setSuccessMessage(CLINICA_TEXTS.syncSuccess(result.created, result.updated));
      await onSyncCompleted();
    } catch {
      setErrorMessage(CLINICA_TEXTS.syncError);
    } finally {
      await loadSyncStatus();
    }
  }, [isSyncing, loadSyncStatus, onSyncCompleted]);

  return {
    errorMessage,
    handleSync,
    isSyncing,
    successMessage,
  };
}
