import { useCallback, useEffect, useRef, useState } from "react";
import { getClinicaClients } from "../api/clinica.api";
import {
  CLINICA_CLIENTS_DEBOUNCE_MS,
  CLINICA_ROWS_PER_PAGE,
  CLINICA_TEXTS,
} from "../constants/clinica.constants";
import type { ClinicaClient } from "../types/clinicaClient.types";

export function useClinicaClients() {
  const [clients, setClients] = useState<ClinicaClient[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestSequenceRef = useRef(0);
  const suppressNextLoadRef = useRef(false);

  const loadClients = useCallback(async () => {
    const requestSequence = ++requestSequenceRef.current;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getClinicaClients({
        search,
        page: page + 1,
        limit: CLINICA_ROWS_PER_PAGE,
      });

      if (requestSequenceRef.current === requestSequence) {
        setClients(result.items);
        setTotalClients(result.total);
      }
    } catch {
      if (requestSequenceRef.current === requestSequence) {
        setErrorMessage(CLINICA_TEXTS.loadClientsError);
      }
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        setIsLoading(false);
      }
    }
  }, [page, search]);

  useEffect(() => {
    if (suppressNextLoadRef.current) {
      suppressNextLoadRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadClients();
    }, CLINICA_CLIENTS_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      requestSequenceRef.current += 1;
    };
  }, [loadClients]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const showSingleClient = useCallback((client: ClinicaClient) => {
    requestSequenceRef.current += 1;
    suppressNextLoadRef.current = true;
    setSearch(client.externalPatientId ?? "");
    setPage(0);
    setClients([client]);
    setTotalClients(1);
    setErrorMessage("");
    setIsLoading(false);
  }, []);

  return {
    clients,
    errorMessage,
    handleSearchChange,
    isLoading,
    loadClients,
    page,
    rowsPerPage: CLINICA_ROWS_PER_PAGE,
    search,
    setErrorMessage,
    setPage,
    showSingleClient,
    totalClients,
  };
}
