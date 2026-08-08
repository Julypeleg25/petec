import { useCallback, useEffect, useState } from "react";
import { getClinicaClientByExternalPatientId, syncClinicaClient } from "../api/clinica.api";
import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient } from "../types/clinicaClient.types";
import { logger } from "../../../lib/logger";

type UseClinicaManualClientSyncParams = {
  onSynced: (client: ClinicaClient) => void;
  initialClientId?: string;
};

export function useClinicaManualClientSync({
  onSynced,
  initialClientId = "",
}: UseClinicaManualClientSyncParams) {
  const [value, setRawValue] = useState(initialClientId.replace(/\D/g, ""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setRawValue(initialClientId.replace(/\D/g, ""));
    setErrorMessage("");
    setSuccessMessage("");
  }, [initialClientId]);

  const setValue = useCallback((nextValue: string) => {
    setRawValue(nextValue.replace(/\D/g, ""));
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  const submit = useCallback(async () => {
    const externalPatientId = value.trim();

    if (!/^\d+$/.test(externalPatientId) || isSubmitting) {
      setErrorMessage(CLINICA_TEXTS.manualSyncIdOnlyError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const syncResult = await syncClinicaClient(externalPatientId);

      if (!syncResult.found) {
        setErrorMessage(CLINICA_TEXTS.manualSyncNotFound);
        return;
      }

      const client = await getClinicaClientByExternalPatientId(externalPatientId);

      onSynced(client);
      setSuccessMessage(CLINICA_TEXTS.manualSyncSuccess(externalPatientId));
    } catch (error) {
      logger.error(
        "Clinica manual client sync failed",
        error instanceof Error ? error.message : String(error),
        {
          operation: "fetch_client_by_id",
          externalPatientId,
        },
      );
      setErrorMessage(CLINICA_TEXTS.manualSyncError);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSynced, value]);

  return {
    value,
    isSubmitting,
    errorMessage,
    successMessage,
    setValue,
    submit,
  };
}
