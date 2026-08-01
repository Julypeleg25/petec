import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import type { ClinicalSummaryResultDTO } from "@petec/shared";
import { patientsApi } from "../../../../../features/patients/patients.api";
import { toHebrewErrorMessage } from "../../../../../lib/errorMessages";
import { CLINICAL_SUMMARY_ERROR_MESSAGE } from "./clinicalSummary.constants";

type ClinicalSummaryRequestResult =
  | { summary: ClinicalSummaryResultDTO; error: null }
  | { summary: null; error: string };

const formatClinicalSummaryError = (error: unknown): string => {
  const hasServerResponse = isAxiosError(error) && Boolean(error.response);
  const message = hasServerResponse
    ? toHebrewErrorMessage(error)
    : CLINICAL_SUMMARY_ERROR_MESSAGE;
  return message;
};

export const requestClinicalSummary = async (
  patientId: string,
  date?: string,
): Promise<ClinicalSummaryRequestResult> => {
  try {
    const summary = await patientsApi.generateClinicalSummary(patientId, date);
    return { summary, error: null };
  } catch (error) {
    return { summary: null, error: formatClinicalSummaryError(error) };
  }
};

export const useClinicalSummary = (patientId: string) => {
  const [summary, setSummary] = useState<ClinicalSummaryResultDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDate, setLoadingDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const requestInProgressRef = useRef(false);

  useEffect(() => {
    setSummary(null);
    setErrorMessage("");
    setLoadingDate("");
    setSelectedDate("");
    requestInProgressRef.current = false;
  }, [patientId]);

  const requestAndStoreSummary = useCallback(
    async (date?: string, preserveOverview = false) => {
      if (requestInProgressRef.current) return;

      requestInProgressRef.current = true;
      setIsLoading(true);
      setLoadingDate(date ?? "");
      setErrorMessage("");

      const result = await requestClinicalSummary(patientId, date);
      if (result.summary) {
        setSummary((currentSummary) =>
          preserveOverview && currentSummary
            ? {
                ...currentSummary,
                summaryDate: result.summary.summaryDate,
                availableDates: result.summary.availableDates,
                medicationAdministrations:
                  result.summary.medicationAdministrations,
                caseDetailItems: result.summary.caseDetailItems,
              }
            : result.summary,
        );
        setSelectedDate(result.summary.summaryDate);
      } else {
        if (!preserveOverview) setSummary(null);
        setErrorMessage(result.error);
        toast.error(result.error);
      }

      requestInProgressRef.current = false;
      setIsLoading(false);
      setLoadingDate("");
    },
    [patientId],
  );

  const generateSummary = useCallback(
    (date?: string) => requestAndStoreSummary(date),
    [requestAndStoreSummary],
  );
  const selectSummaryDate = useCallback(
    (date: string) => requestAndStoreSummary(date, true),
    [requestAndStoreSummary],
  );

  return {
    errorMessage,
    generateSummary,
    isLoading,
    loadingDate,
    selectedDate,
    selectSummaryDate,
    summary,
  };
};
