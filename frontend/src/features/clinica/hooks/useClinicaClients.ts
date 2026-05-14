import { useCallback, useEffect, useState } from "react";
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

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getClinicaClients({
        search,
        page: page + 1,
        limit: CLINICA_ROWS_PER_PAGE,
      });

      setClients(result.items);
      setTotalClients(result.total);
    } catch {
      setErrorMessage(CLINICA_TEXTS.loadClientsError);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadClients();
    }, CLINICA_CLIENTS_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loadClients]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
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
    totalClients,
  };
}
