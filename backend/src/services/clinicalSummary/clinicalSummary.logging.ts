import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import { ClinicalSummaryProviderError } from "./clinicalSummary.provider.js";
import type { ClinicalSummaryFailureCategory } from "./clinicalSummary.types.js";

const LOG_MODULE = "clinical_summary";
const LOG_OPERATION = "generate_clinical_summary";

export interface ClinicalSummaryLogContext {
  readonly patientId: string;
  readonly userId: string;
  readonly requestId?: string;
  readonly requestedDate?: string;
}

interface ClinicalSummaryLogMetrics {
  readonly durationMs: number;
  readonly inputWasTruncated: boolean;
}

const EXPECTED_REJECTION_CATEGORIES: ReadonlySet<ClinicalSummaryFailureCategory> =
  new Set([
    "disabled",
    "missing_key",
    "not_found",
    "empty_record",
    "rate_limit",
    "duplicate_request",
  ]);

const buildBaseMeta = (
  context: ClinicalSummaryLogContext,
  metrics: ClinicalSummaryLogMetrics,
) => ({
  module: LOG_MODULE,
  operation: LOG_OPERATION,
  request_id: context.requestId,
  user_id: context.userId,
  patient_id: context.patientId,
  requested_date: context.requestedDate,
  provider: "groq",
  model: ENV.groqModel,
  duration_ms: metrics.durationMs,
  input_was_truncated: metrics.inputWasTruncated,
});

export const logClinicalSummarySuccess = (
  context: ClinicalSummaryLogContext,
  metrics: ClinicalSummaryLogMetrics,
): void => {
  logger.info("Clinical summary generated", {
    ...buildBaseMeta(context, metrics),
    event: "clinical_summary_generation_succeeded",
    outcome: "success",
  });
};

const isExpectedRejection = (
  category: ClinicalSummaryFailureCategory,
): boolean => EXPECTED_REJECTION_CATEGORIES.has(category);

export const logClinicalSummaryFailure = (
  context: ClinicalSummaryLogContext,
  metrics: ClinicalSummaryLogMetrics,
  category: ClinicalSummaryFailureCategory,
  error: Error,
): void => {
  const providerError =
    error instanceof ClinicalSummaryProviderError ? error : undefined;
  const meta = {
    ...buildBaseMeta(context, metrics),
    event: "clinical_summary_generation_failed",
    outcome: "failure",
    failure_category: category,
    error_name: error.name,
    provider_http_status: providerError?.providerStatus,
    provider_request_id: providerError?.providerRequestId,
    cause_name: error.cause instanceof Error ? error.cause.name : undefined,
    stack: error.stack,
  };

  if (isExpectedRejection(category)) {
    logger.warn("Clinical summary generation rejected", meta);
    return;
  }

  logger.error("Clinical summary generation failed", meta);
};
