import cron from "node-cron";
import { ClinicScraperService } from "../services/clinicScraper.service";
import { PatientModel } from "../models/Patient";
import { ScrapedPatient } from "../types/clinic.types";
import { ENV } from "../config/config";
import { logger } from "../utils/logger";

const JOB_NAME = "clinic-sync";
let isRunning = false;

async function savePatients(patients: ScrapedPatient[]): Promise<void> {
  for (const patient of patients) {
    const updatePayload: {
      name: string;
      owner: {
        name: string;
        phone: string;
      };
      photoName?: string;
    } = {
      name: patient.name,
      owner: {
        name: patient.ownerName,
        phone: patient.ownerPhone,
      },
    };

    if (patient.photoName) {
      updatePayload.photoName = patient.photoName;
    }

    await PatientModel.findOneAndUpdate(
      {
        name: patient.name,
        "owner.phone": patient.ownerPhone,
      },
      {
        $set: updatePayload,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}

export async function runClinicSyncJob(): Promise<void> {
  if (isRunning) {
    logger.info(`[${JOB_NAME}] skipped because job is already running`);
    return;
  }

  isRunning = true;
  const scraper = new ClinicScraperService();

  try {
    const username = ENV.clinicUsername;
    const password = ENV.clinicPassword;

    if (!username || !password) {
      throw new Error("Missing clinic credentials in config");
    }

    await scraper.init();

    const patients = await scraper.scrapePatients({
      username,
      password,
    });

    await savePatients(patients);

    logger.info(`[${JOB_NAME}] completed successfully. synced ${String(patients.length)} patients`);
  } catch (error) {
    logger.error(`[${JOB_NAME}] failed`, {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await scraper.close();
    isRunning = false;
  }
}

export function scheduleClinicSyncJob(): void {
  cron.schedule(
    ENV.clinicSyncCron,
    async () => {
      await runClinicSyncJob();
    },
    {
      timezone: ENV.clinicTimezone,
    },
  );

  logger.info(`[${JOB_NAME}] scheduled with cron ${ENV.clinicSyncCron} (${ENV.clinicTimezone})`);
}