import cron from "node-cron";
import { clinicaQueryImportService } from "../services/clinicaQueryImport.service.js";

const CLINICA_DAILY_SYNC_CRON = "0 6 * * *";

export const startClinicaDailySyncJob = (): void => {
  console.log("Clinica cron job initialized");

  cron.schedule(CLINICA_DAILY_SYNC_CRON, async () => {
    console.log("Running clinica sync job...");

    try {
      const result = await clinicaQueryImportService.runFullSync();

      console.log("Clinica sync completed");
      console.log(result);
    } catch (error) {
      console.error("Clinica sync failed", error);
    }
  });
};