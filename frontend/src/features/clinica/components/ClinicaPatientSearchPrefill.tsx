import { useEffect, useMemo, useRef, useState } from "react";

import { getClinicaCachedPet, getClinicaClients } from "../api/clinica.api";
import {
  CLINICA_PREFILL_SEARCH_DEBOUNCE_MS,
  CLINICA_PREFILL_SEARCH_LIMIT,
  CLINICA_TEXTS,
} from "../constants/clinica.constants";
import { useClinicaManualClientSync } from "../hooks/useClinicaManualClientSync";
import { mapClinicaClientToNewPatientState } from "../mappers/clinicaClientToNewPatient.mapper";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import type { ClinicaNewPatientState } from "../types/clinicaNewPatient.types";
import { findHydratedClinicaPet, getClinicaPetKey } from "../utils/clinicaPet.utils";

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
  const [loadingPetKey, setLoadingPetKey] = useState("");
  const selectionSequenceRef = useRef(0);

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

  const manualSync = useClinicaManualClientSync({
    onSynced: (client) => {
      setClients([client]);
      setErrorMessage("");
    },
  });

  const handleSelect = async (client: ClinicaClient, pet: ClinicaPet) => {
    const selectionSequence = ++selectionSequenceRef.current;
    setLoadingPetKey(getClinicaPetKey(client, pet));
    setErrorMessage("");
    try {
      const cachedClient = await getClinicaCachedPet(client._id, pet.name);
      if (selectionSequenceRef.current !== selectionSequence) return;
      const cachedPet = findHydratedClinicaPet(cachedClient, pet);
      if (!cachedPet) throw new Error("Cached Clinica pet was not returned");
      onSelect(mapClinicaClientToNewPatientState(cachedClient, cachedPet));
      setSearch(`${pet.name || "-"} / ${client.ownerName}`);
      setClients([]);
      setHasSelectedClient(true);
    } catch {
      if (selectionSequenceRef.current === selectionSequence) {
        setErrorMessage(CLINICA_TEXTS.prefillHydrationError);
      }
    } finally {
      if (selectionSequenceRef.current === selectionSequence) {
        setLoadingPetKey("");
      }
    }
  };

  const handleClear = () => {
    selectionSequenceRef.current += 1;
    setSearch("");
    setClients([]);
    setErrorMessage("");
    setHasSelectedClient(false);
    setLoadingPetKey("");
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
            selectionSequenceRef.current += 1;
            setSearch(event.target.value);
            setClients([]);
            setErrorMessage("");
            setHasSelectedClient(false);
            setLoadingPetKey("");
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
      {loadingPetKey && (
        <div className="clinica-prefill-search-status">
          {CLINICA_TEXTS.openingCase}
        </div>
      )}
      {errorMessage && (
        <div className="clinica-prefill-search-status error">
          {errorMessage}
        </div>
      )}
      {shouldShowEmptyState && (
        <>
          <div className="clinica-prefill-search-status">
            {CLINICA_TEXTS.prefillSearchEmpty}
          </div>
          <div className="clinica-prefill-manual-sync">
            {!manualSync.isOpen && (
              <button
                type="button"
                className="clinica-prefill-manual-sync-trigger"
                onClick={manualSync.open}
              >
                <span className="clinica-prefill-manual-sync-plus">+</span>
                {CLINICA_TEXTS.manualSyncTrigger}
              </button>
            )}
            {manualSync.isOpen && (
              <div className="clinica-prefill-manual-sync-row">
                <input
                  className="clinica-prefill-manual-sync-input"
                  value={manualSync.value}
                  placeholder={CLINICA_TEXTS.manualSyncPlaceholder}
                  disabled={manualSync.isSubmitting}
                  onChange={(event) => manualSync.setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      manualSync.submit();
                    }
                  }}
                />
                <button
                  type="button"
                  className="clinica-prefill-manual-sync-submit"
                  disabled={manualSync.isSubmitting || !manualSync.value.trim()}
                  onClick={manualSync.submit}
                >
                  {manualSync.isSubmitting
                    ? CLINICA_TEXTS.prefillSearchLoading
                    : CLINICA_TEXTS.manualSyncSubmit}
                </button>
                <button
                  type="button"
                  className="clinica-prefill-manual-sync-cancel"
                  disabled={manualSync.isSubmitting}
                  onClick={manualSync.cancel}
                >
                  {CLINICA_TEXTS.manualSyncCancel}
                </button>
              </div>
            )}
            {manualSync.errorMessage && (
              <div className="clinica-prefill-search-status error">
                {manualSync.errorMessage}
              </div>
            )}
          </div>
        </>
      )}
      {options.length > 0 && (
        <div className="clinica-prefill-search-results">
          {options.map(({ client, key, pet }) => (
            <button
              key={key}
              type="button"
              className="clinica-prefill-search-result"
              onClick={() => void handleSelect(client, pet)}
              disabled={Boolean(loadingPetKey)}
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
                {loadingPetKey === getClinicaPetKey(client, pet)
                  ? CLINICA_TEXTS.openingCase
                  : CLINICA_TEXTS.prefillSelectAction}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
