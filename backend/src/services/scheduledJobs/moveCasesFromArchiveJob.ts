import { logger } from "@config/logger";
import { caseRepository } from "@repositories/patient";

const MODULE = "scheduled-jobs";

const toDayRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const moveCasesFromArchive = async (date = new Date()): Promise<void> => {
  const { start, end } = toDayRange(date);

  try {
    logger.info("Starting to move cases from archive", {
      module: MODULE,
      procedure_date_start: start.toISOString(),
      procedure_date_end: end.toISOString(),
    });

    const modifiedCount = await caseRepository.unarchiveByProcedureDateRange(
      start,
      end,
    );

    logger.info("Finished moving cases from archive", {
      module: MODULE,
      moved_cases: modifiedCount,
    });
  } catch (error) {
    logger.error("Failed to move cases from archive", {
      module: MODULE,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

