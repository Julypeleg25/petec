import { NotFoundError, type ClinicalSummaryResultDTO } from "@petec/shared";
import { ENV } from "../../config/config.js";
import { PatientModel } from "../../models/index.js";
import {
  buildClinicalCaseDetailItems,
  buildClinicalSummaryInput,
  getClinicalSummaryDates,
  hasClinicalSummaryContent,
} from "./clinicalSummary.input.js";
import { ClinicalSummaryUnavailableError } from "./clinicalSummary.error.js";
import {
  logClinicalSummaryFailure,
  logClinicalSummarySuccess,
  type ClinicalSummaryLogContext,
} from "./clinicalSummary.logging.js";
import {
  generateGroqClinicalSummary,
  ClinicalSummaryProviderError,
} from "./clinicalSummary.provider.js";
import { withClinicalSummaryLimit } from "./clinicalSummary.rateLimit.js";
import { findLatestClinicalCase } from "./clinicalSummary.query.js";
import type {
  ClinicalSummaryFailureCategory,
  ClinicalSummaryInput,
} from "./clinicalSummary.types.js";

const getFailureCategory = (error: unknown): ClinicalSummaryFailureCategory => {
  if (error instanceof ClinicalSummaryProviderError) return error.category;
  if (error instanceof ClinicalSummaryUnavailableError) return error.category;
  if (error instanceof NotFoundError) return "not_found";
  return "internal";
};

class ClinicalSummaryService {
  async generate({
    patientId,
    userId,
    requestedDate,
    requestId,
  }: ClinicalSummaryLogContext): Promise<ClinicalSummaryResultDTO> {
    const logContext: ClinicalSummaryLogContext = {
      patientId,
      userId,
      requestedDate,
      requestId,
    };

    return withClinicalSummaryLimit(logContext, async () => {
      const startedAt = Date.now();
      let truncated = false;
      try {
        if (!ENV.aiSummaryEnabled)
          throw new ClinicalSummaryUnavailableError("disabled");
        if (!ENV.groqApiKey)
          throw new ClinicalSummaryUnavailableError("missing_key");
        const patientExists = await PatientModel.exists({ _id: patientId });
        if (!patientExists) throw new NotFoundError("Patient not found");
        const caseRecord = await findLatestClinicalCase(patientId);
        if (!caseRecord)
          throw new ClinicalSummaryUnavailableError("empty_record");
        const availableDates = getClinicalSummaryDates(caseRecord);
        const summaryDate = requestedDate ?? availableDates[0];
        if (!summaryDate || !availableDates.includes(summaryDate)) {
          throw new ClinicalSummaryUnavailableError("empty_record");
        }
        let input: ClinicalSummaryInput;
        try {
          input = buildClinicalSummaryInput(caseRecord);
        } catch (error) {
          throw new ClinicalSummaryUnavailableError(
            "input_too_large",
            error instanceof Error ? error : undefined,
          );
        }
        truncated = input.sourceMetadata.inputWasTruncated;
        const caseDetailItems = buildClinicalCaseDetailItems(
          caseRecord,
          summaryDate,
        );
        if (!hasClinicalSummaryContent(input))
          throw new ClinicalSummaryUnavailableError("empty_record");
        const result = await generateGroqClinicalSummary(input);
        logClinicalSummarySuccess(logContext, {
          durationMs: Date.now() - startedAt,
          inputWasTruncated: truncated,
        });
        return {
          ...result,
          summaryDate,
          availableDates,
          medicationAdministrations: input.treatments,
          caseDetailItems,
        };
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error("Unknown summary error");
        const category = getFailureCategory(normalizedError);
        logClinicalSummaryFailure(
          logContext,
          {
            durationMs: Date.now() - startedAt,
            inputWasTruncated: truncated,
          },
          category,
          normalizedError,
        );
        if (error instanceof NotFoundError) throw error;
        if (error instanceof ClinicalSummaryUnavailableError) throw error;
        throw new ClinicalSummaryUnavailableError(category, normalizedError);
      }
    });
  }
}

export const clinicalSummaryService = new ClinicalSummaryService();
