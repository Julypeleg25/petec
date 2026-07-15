import cron, { ScheduledTask } from "node-cron";
import { logger } from "../config/logger.js";
import { clinicaClientService } from "../services/clinica/clinicaClient.service.js";
import { syncProcedureArchiveStatus } from "../services/scheduledJobs/procedureArchiveSyncJob.js";

const CLINICA_DAILY_SYNC_CRON = "0 6 * * *";
const PROCEDURE_ARCHIVE_SYNC_CRON = "0 8 * * *";
const JERUSALEM_TIME_ZONE = "Asia/Jerusalem";

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

  void syncProcedureArchiveStatus(new Date());

  const procedureArchiveSyncJob = cron.schedule(
    PROCEDURE_ARCHIVE_SYNC_CRON,
    () => {
      void syncProcedureArchiveStatus(new Date());
    },
    {
      timezone: JERUSALEM_TIME_ZONE,
    },
  );

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
      timezone: JERUSALEM_TIME_ZONE,
    },
  );

  scheduledJobs.push(procedureArchiveSyncJob);
  scheduledJobs.push(clinicaDailySyncJob);

  return () => {
    scheduledJobs.forEach((job) => job.stop());

    logger.info("Scheduled jobs stopped", {
      module: "scheduler",
    });
  };
};
