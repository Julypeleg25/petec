import { useCallback, useState } from "react";
import {
  getClinicaClientByExternalPatientId,
  syncClinicaClient,
} from "../api/clinica.api";
import { CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient } from "../types/clinicaClient.types";
import { logger } from "../../../lib/logger";

type UseClinicaClientUpdateParams = {
  onUpdated: (client: ClinicaClient) => void;
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
        const updatedClient = await getClinicaClientByExternalPatientId(
          client.externalPatientId,
        );
        onUpdated(updatedClient);
      } catch (error) {
        logger.error(
          "Clinica single client sync failed",
          error instanceof Error ? error.message : String(error),
          {
            operation: "sync_single_client",
            externalPatientId: client.externalPatientId,
          },
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
