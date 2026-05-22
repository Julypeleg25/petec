import cron, { ScheduledTask } from "node-cron";
import { logger } from "../config/logger.js";
import { clinicaClientService } from "../services/clinica/clinicaClient.service.js";

const CLINICA_DAILY_SYNC_CRON = "0 6 * * *";

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
        const err = error instanceof Error ? error : new Error(String(error));

        logger.error("Clinica daily sync failed", {
          module: "clinica",
          event: "clinica_daily_sync_failed",
          error_name: err.name,
          error_message: err.message,
          error_stack: err.stack,
        });
      }
    },
    {
      timezone: "Asia/Jerusalem",
    },
  );

  scheduledJobs.push(clinicaDailySyncJob);

  return () => {
    scheduledJobs.forEach((job) => job.stop());

    logger.info("Scheduled jobs stopped", {
      module: "scheduler",
    });
  };
};
