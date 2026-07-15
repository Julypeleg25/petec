import { logger } from "../../config/logger.js";
import { toDateInputString } from "../../mappers/common/common.mappers.utils.js";
import { caseRepository } from "../../repositories/patient/index.js";

const MODULE = "scheduled-jobs";

type ProcedureArchiveSyncResult = {
  unarchivedScheduledCases: number;
  unarchivedActiveGridCases: number;
  archivedPastCases: number;
};

const syncProcedureArchiveCounts = async (
  date: Date,
): Promise<ProcedureArchiveSyncResult> => {
  const [
    unarchivedScheduledCases,
    unarchivedActiveGridCases,
    archivedPastCases,
  ] = await Promise.all([
    caseRepository.unarchiveProceduresScheduledForDate(date),
    caseRepository.unarchiveProceduresWithCaseDetailsOnOrAfterDate(date),
    caseRepository.archiveProceduresScheduledBeforeDate(date),
  ]);

  return {
    unarchivedScheduledCases,
    unarchivedActiveGridCases,
    archivedPastCases,
  };
};

export const syncProcedureArchiveStatus = async (date = new Date()): Promise<void> => {
  const procedureDateKey = toDateInputString(date);

  try {
    logger.info("Starting procedure archive sync", {
      module: MODULE,
      procedure_date: procedureDateKey ?? date.toISOString(),
    });

    const syncResult = await syncProcedureArchiveCounts(date);

    logger.info("Finished procedure archive sync", {
      module: MODULE,
      moved_cases: syncResult.unarchivedScheduledCases,
      moved_grid_cases: syncResult.unarchivedActiveGridCases,
      archived_past_cases: syncResult.archivedPastCases,
      procedure_date: procedureDateKey ?? date.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to sync procedure archive status", {
      module: MODULE,
      procedure_date: procedureDateKey ?? date.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
