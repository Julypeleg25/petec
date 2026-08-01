import { ClinicalSummaryUnavailableError } from "./clinicalSummary.error.js";
import {
  logClinicalSummaryFailure,
  type ClinicalSummaryLogContext,
} from "./clinicalSummary.logging.js";

const MAX_REQUESTS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;
const requestHistory = new Map<string, number[]>();
const activeUsers = new Set<string>();
const activePatients = new Set<string>();

export const withClinicalSummaryLimit = async <T>(
  context: ClinicalSummaryLogContext,
  task: () => Promise<T>,
): Promise<T> => {
  const { patientId, userId } = context;
  const now = Date.now();
  const recent = (requestHistory.get(userId) ?? []).filter(
    (time) => now - time < HOUR_MS,
  );
  const hourlyLimitReached = recent.length >= MAX_REQUESTS_PER_HOUR;
  const requestAlreadyActive =
    activeUsers.has(userId) || activePatients.has(patientId);
  if (hourlyLimitReached || requestAlreadyActive) {
    const category = hourlyLimitReached ? "rate_limit" : "duplicate_request";
    const error = new ClinicalSummaryUnavailableError(category);
    logClinicalSummaryFailure(
      context,
      { durationMs: 0, inputWasTruncated: false },
      category,
      error,
    );
    throw error;
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
  requestHistory.clear();
  activeUsers.clear();
  activePatients.clear();
};
