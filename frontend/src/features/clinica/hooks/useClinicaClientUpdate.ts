import { useCallback, useState } from "react";
import { syncClinicaClient } from "../api/clinica.api";
import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient } from "../types/clinicaClient.types";
import { logger } from "../../../lib/logger";

type UseClinicaClientUpdateParams = {
  onUpdated: () => Promise<void> | void;
};

export function useClinicaClientUpdate({ onUpdated }: UseClinicaClientUpdateParams) {
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpdateClient = useCallback(
    async (client: ClinicaClient) => {
      if (!client.externalPatientId || updatingClientId) {
        return;
      }

      setUpdatingClientId(client.externalPatientId);
      setErrorMessage("");

      try {
        await syncClinicaClient(client.externalPatientId);
        await onUpdated();
      } catch (error) {
        logger.error(
          "Clinica single client sync failed",
          error instanceof Error ? error.message : String(error),
        );
        setErrorMessage(CLINICA_TEXTS.updateClientError);
      } finally {
        setUpdatingClientId(null);
      }
    },
    [onUpdated, updatingClientId],
  );

  return {
    errorMessage,
    handleUpdateClient,
    updatingClientId,
  };
}
