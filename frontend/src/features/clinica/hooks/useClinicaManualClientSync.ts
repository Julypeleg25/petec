import { useCallback, useState } from "react";
import { getClinicaClientByExternalPatientId, syncClinicaClient } from "../api/clinica.api";
import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient } from "../types/clinicaClient.types";
import { logger } from "../../../lib/logger";

type UseClinicaManualClientSyncParams = {
  onSynced: (client: ClinicaClient) => void;
};

export function useClinicaManualClientSync({ onSynced }: UseClinicaManualClientSyncParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const open = useCallback(() => {
    setIsOpen(true);
    setErrorMessage("");
  }, []);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setValue("");
    setErrorMessage("");
  }, []);

  const submit = useCallback(async () => {
    const externalPatientId = value.trim();

    if (!externalPatientId || isSubmitting) {
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
      setIsOpen(false);
      setValue("");
    } catch (error) {
      logger.error(
        "Clinica manual client sync failed",
        error instanceof Error ? error.message : String(error),
      );
      setErrorMessage(CLINICA_TEXTS.manualSyncError);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSynced, value]);

  return {
    isOpen,
    value,
    isSubmitting,
    errorMessage,
    open,
    cancel,
    setValue,
    submit,
  };
}
