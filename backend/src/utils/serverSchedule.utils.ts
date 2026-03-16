import { logger } from "@config/logger";
import { moveCasesFromArchive } from "@services/scheduledJobs/moveCasesFromArchiveJob";

const SCHEDULE_TICK_MS = 60_000;
const MOVE_CASES_FROM_ARCHIVE_HOUR = 8;

const toRunDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const initializeScheduledJobs = (
  isProduction: boolean,
): (() => void) => {
  if (!isProduction) {
    return () => undefined;
  }

  logger.info("Initializing scheduled jobs");
  let lastArchiveMoveRunDate: string | null = null;

  const tick = (): void => {
    const now = new Date();
    const runDateKey = toRunDateKey(now);
    const shouldRunArchiveMove =
      now.getHours() === MOVE_CASES_FROM_ARCHIVE_HOUR &&
      now.getMinutes() === 0 &&
      lastArchiveMoveRunDate !== runDateKey;

    if (shouldRunArchiveMove) {
      lastArchiveMoveRunDate = runDateKey;
      void moveCasesFromArchive(now);
    }
  };

  tick();
  const scheduler = setInterval(tick, SCHEDULE_TICK_MS);

  return () => {
    clearInterval(scheduler);
  };
};

