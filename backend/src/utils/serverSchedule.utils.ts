import cron, { ScheduledTask } from "node-cron";
import { logger } from "../config/logger.js";
import { clinicaClientService } from "../services/clinica/clinicaClient.service.js";
import { runClinicaBackfillClients } from "../services/clinicaBackfillClients.service.js";
import {
  acquireClinicaScrapeLock,
  releaseClinicaScrapeLock,
} from "./clinicaScrapeLock.js";

const CLINICA_DAILY_SYNC_CRON = "0 6 * * *";

// TEMPORARY one-off job: fires once at 2026-07-19 00:00 Asia/Jerusalem to do a
// large full-client backfill (all clients incl. inactive) into the
// clinica_backfill_clients collection. node-cron's pattern has no year field,
// so it WILL fire again on July 19th of any future year if this block is left
// in place — delete this block (and the import above) after tonight's run.
const CLINICA_ONE_OFF_BACKFILL_CRON = "0 0 19 7 *";
const CLINICA_ONE_OFF_BACKFILL_DEADLINE_MS = 5 * 3_600_000 + 45 * 60_000; // 05:45, 15 min before the daily sync
const CLINICA_ONE_OFF_BACKFILL_LIMIT = 10_000;

export const initializeScheduledJobs = (isProduction: boolean): (() => void) => {
  const scheduledJobs: ScheduledTask[] = [];

  if (!isProduction) {
    logger.info("Scheduled jobs skipped in non-production mode", {
      module: "scheduler",
    });

    return () => undefined;
  }

  logger.info("Scheduled jobs initialized", {
    module: "scheduler",
  });

  const clinicaDailySyncJob = cron.schedule(
    CLINICA_DAILY_SYNC_CRON,
    async () => {
      logger.info("Running Clinica daily sync job", {
        module: "clinica",
        event: "clinica_daily_sync_started",
      });

      try {
        const result = await clinicaClientService.syncClients();

        logger.info("Clinica daily sync completed", {
          module: "clinica",
          event: "clinica_daily_sync_completed",
          result,
        });
      } catch (error) {
        logger.error("Clinica daily sync failed", {
          module: "clinica",
          event: "clinica_daily_sync_failed",
          error,
        });
      }
    },
    {
      timezone: "Asia/Jerusalem",
    },
  );

  scheduledJobs.push(clinicaDailySyncJob);

  const clinicaOneOffBackfillJob = cron.schedule(
    CLINICA_ONE_OFF_BACKFILL_CRON,
    () => {
      clinicaOneOffBackfillJob.stop();

      if (!acquireClinicaScrapeLock("backfill")) {
        logger.warn("Clinica one-off backfill skipped: daily sync is running", {
          module: "clinica",
          event: "clinica_one_off_backfill_skipped",
        });

        return;
      }

      logger.info("Running Clinica one-off backfill job", {
        module: "clinica",
        event: "clinica_one_off_backfill_started",
      });

      const deadline = new Date(Date.now() + CLINICA_ONE_OFF_BACKFILL_DEADLINE_MS);

      runClinicaBackfillClients({
        dryRun: false,
        resume: false,
        resetNew: false,
        clearNewOnly: false,
        allClients: true,
        plusOnly: false,
        detailsOnly: false,
        limit: CLINICA_ONE_OFF_BACKFILL_LIMIT,
        fromPage: 1,
        delayMs: 1000,
        batchSize: 500,
        deadline,
      })
        .then((result) => {
          logger.info("Clinica one-off backfill completed", {
            module: "clinica",
            event: "clinica_one_off_backfill_completed",
            result,
          });
        })
        .catch((error: unknown) => {
          logger.error("Clinica one-off backfill failed", {
            module: "clinica",
            event: "clinica_one_off_backfill_failed",
            error,
          });
        })
        .finally(() => {
          releaseClinicaScrapeLock("backfill");
        });
    },
    {
      timezone: "Asia/Jerusalem",
    },
  );

  scheduledJobs.push(clinicaOneOffBackfillJob);

  return () => {
    scheduledJobs.forEach((job) => job.stop());

    logger.info("Scheduled jobs stopped", {
      module: "scheduler",
    });
  };
};