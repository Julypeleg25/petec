import { ClinicalSummaryUnavailableError } from "./clinicalSummary.error.js";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";

const MAX_REQUESTS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;
const requestHistory = new Map<string, number[]>();
const activeUsers = new Set<string>();
const activePatients = new Set<string>();

export const withClinicalSummaryLimit = async <T>(userId: string, patientId: string, task: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const recent = (requestHistory.get(userId) ?? []).filter((time) => now - time < HOUR_MS);
  if (recent.length >= MAX_REQUESTS_PER_HOUR || activeUsers.has(userId) || activePatients.has(patientId)) {
    logger.info("Clinical summary audit", {
      module: "clinical_summary", event: "clinical_summary_requested", user_id: userId,
      patient_id: patientId, model: ENV.groqModel, success: false,
      failure_category: "duplicate_request", duration_ms: 0, input_was_truncated: false,
    });
    throw new ClinicalSummaryUnavailableError(429);
  }
  recent.push(now);
  requestHistory.set(userId, recent);
  activeUsers.add(userId);
  activePatients.add(patientId);
  try {
    return await task();
  } finally {
    activeUsers.delete(userId);
    activePatients.delete(patientId);
  }
};

export const resetClinicalSummaryLimitsForTests = (): void => {
  requestHistory.clear(); activeUsers.clear(); activePatients.clear();
};
