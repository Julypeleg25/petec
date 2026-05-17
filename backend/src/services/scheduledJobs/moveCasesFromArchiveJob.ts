import { logger } from "../../config/logger.js";
import { toDateInputString } from "../../mappers/common/common.mappers.utils.js";
import { caseRepository } from "../../repositories/patient/index.js";

const MODULE = "scheduled-jobs";

export const moveCasesFromArchive = async (date = new Date()): Promise<void> => {
  const procedureDateKey = toDateInputString(date);

  try {
    logger.info("Starting to move cases from archive", {
      module: MODULE,
      procedure_date: procedureDateKey ?? date.toISOString(),
    });

    const modifiedCount =
      await caseRepository.unarchiveProceduresScheduledForDate(date);

    logger.info("Finished moving cases from archive", {
      module: MODULE,
      moved_cases: modifiedCount,
      procedure_date: procedureDateKey ?? date.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to move cases from archive", {
      module: MODULE,
      procedure_date: procedureDateKey ?? date.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
