import { useEffect, useMemo, useState } from "react";

import { getClinicaClients } from "../api/clinica.api";
import {
  CLINICA_PREFILL_SEARCH_DEBOUNCE_MS,
  CLINICA_PREFILL_SEARCH_LIMIT,
  CLINICA_TEXTS,
} from "../constants/clinica.constants";
import { mapClinicaClientToNewPatientState } from "../mappers/clinicaClientToNewPatient.mapper";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import type { ClinicaNewPatientState } from "../types/clinicaNewPatient.types";
import { getClinicaPetKey } from "../utils/clinicaPet.utils";

interface ClinicaPatientSearchPrefillProps {
  onClear?: () => void;
  onSelect: (state: ClinicaNewPatientState) => void;
}

interface ClinicaSearchOption {
  client: ClinicaClient;
  pet: ClinicaPet;
  key: string;
}

const getPetOptions = (client: ClinicaClient): ClinicaSearchOption[] => {
  return client.pets.map((pet, index) => ({
    client,
    pet,
    key: `${getClinicaPetKey(client, pet)}:${index}`,
  }));
};

export function ClinicaPatientSearchPrefill({
  onClear,
  onSelect,
}: ClinicaPatientSearchPrefillProps) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClinicaClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSelectedClient, setHasSelectedClient] = useState(false);

  useEffect(() => {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      setClients([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    if (hasSelectedClient) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    const timeoutId = window.setTimeout(() => {
      getClinicaClients({
        search: trimmedSearch,
        page: 1,
        limit: CLINICA_PREFILL_SEARCH_LIMIT,
      })
        .then((result) => {
          if (!isActive) {
            return;
          }

          setClients(result.items);
          setErrorMessage("");
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          setClients([]);
          setErrorMessage(CLINICA_TEXTS.prefillSearchError);
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    }, CLINICA_PREFILL_SEARCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [hasSelectedClient, search]);

  const options = useMemo(
    () => clients.flatMap((client) => getPetOptions(client)),
    [clients],
  );

  const shouldShowEmptyState =
    search.trim().length >= 2 &&
    !hasSelectedClient &&
    !isLoading &&
    !errorMessage &&
    options.length === 0;

  const handleSelect = (client: ClinicaClient, pet: ClinicaPet) => {
    setErrorMessage("");
    onSelect(mapClinicaClientToNewPatientState(client, pet));
    setSearch(`${pet.name || "-"} / ${client.ownerName}`);
    setClients([]);
    setHasSelectedClient(true);
  };

  const handleClear = () => {
    setSearch("");
    setClients([]);
    setErrorMessage("");
    setHasSelectedClient(false);
    onClear?.();
  };

  return (
    <section className="clinica-prefill-search" dir="rtl">
      <div className="clinica-prefill-search-header">
        <h3>{CLINICA_TEXTS.prefillSearchTitle}</h3>
      </div>
      <div className="clinica-prefill-search-input-row">
        <input
          className="clinica-prefill-search-input"
          value={search}
          placeholder={CLINICA_TEXTS.prefillSearchPlaceholder}
          onChange={(event) => {
            setSearch(event.target.value);
            setClients([]);
            setErrorMessage("");
            setHasSelectedClient(false);
          }}
        />
        {search && (
          <button
            type="button"
            className="clinica-prefill-search-clear"
            onClick={handleClear}
          >
            {CLINICA_TEXTS.prefillClearAction}
          </button>
        )}
      </div>
      {isLoading && (
        <div className="clinica-prefill-search-status">
          {CLINICA_TEXTS.prefillSearchLoading}
        </div>
      )}
      {errorMessage && (
        <div className="clinica-prefill-search-status error">
          {errorMessage}
        </div>
      )}
      {shouldShowEmptyState && (
        <div className="clinica-prefill-search-status">
          {CLINICA_TEXTS.prefillSearchEmpty}
        </div>
      )}
      {options.length > 0 && (
        <div className="clinica-prefill-search-results">
          {options.map(({ client, key, pet }) => (
            <button
              key={key}
              type="button"
              className="clinica-prefill-search-result"
              onClick={() => handleSelect(client, pet)}
            >
              <span className="clinica-prefill-search-result-text">
                <span className="clinica-prefill-search-result-main">
                  {pet.name || "-"} / {client.ownerName}
                </span>
                <span className="clinica-prefill-search-result-meta">
                  {client.externalPatientId || "-"} / {client.ownerPhone || "-"}
                </span>
              </span>
              <span className="clinica-prefill-search-result-action">
                {CLINICA_TEXTS.prefillSelectAction}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
