import type { QueryFilter } from "mongoose";
import { ClinicaClientModel } from "../../models/clinicaClient/index.js";
import type { ClinicaClientDocument } from "../../models/clinicaClient/index.js";
import {
  acquireClinicaScrapeLock,
  releaseClinicaScrapeLock,
} from "../../utils/clinicaScrapeLock.js";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import { BadRequestError, NotFoundError } from "../../constants/error.constants.js";
import {
  runClinicaDiffSync,
  runClinicaLatestSync,
  runClinicaSingleClientSync,
} from "../clinicaApiClients.service.js";

const MODULE = "clinica";

type GetClinicaClientsParams = {
  search?: string;
  page?: number;
  limit?: number;
};

type SyncClinicaClientsResult = {
  totalFromClinica: number;
  created: number;
  updated: number;
  skipped: number;
  syncedAt: Date;
};

type SyncErrorStatus = {
  name: string;
  message: string;
  occurredAt: Date;
};

let isSyncRunning = false;
let lastSyncError: SyncErrorStatus | null = null;

const validateClinicaSyncEnv = (): void => {
  const missingEnvNames = [
    !ENV.clinicaBaseUrl ? "CLINICA_URL" : undefined,
    !ENV.clinicUsername ? "CLINIC_USERNAME" : undefined,
    !ENV.clinicPassword ? "CLINIC_PASSWORD" : undefined,
  ].filter(Boolean);

  if (missingEnvNames.length > 0) {
    throw new BadRequestError(
      `Missing Clinica env vars: ${missingEnvNames.join(", ")}`,
    );
  }
};

const normalizeValue = (value?: string): string =>
  value?.trim().replace(/\s+/g, " ") ?? "";

const buildSearchQuery = (
  search?: string,
): QueryFilter<ClinicaClientDocument> => {
  const cleanSearch = normalizeValue(search);

  if (!cleanSearch) {
    return {};
  }

  return {
    $or: [
      { externalPatientId: { $regex: cleanSearch, $options: "i" } },
      { ownerName: { $regex: cleanSearch, $options: "i" } },
      { ownerPhone: { $regex: cleanSearch, $options: "i" } },
      { "pets.name": { $regex: cleanSearch, $options: "i" } },
    ],
  };
};

class ClinicaClientService {
  getSyncStatus() {
    return {
      isSyncRunning,
      lastSyncError,
    };
  }

  private async runGuardedSync<T>(action: () => Promise<T>): Promise<T> {
    if (isSyncRunning) {
      throw new BadRequestError("Clinica sync is already running");
    }

    if (!acquireClinicaScrapeLock("daily-sync")) {
      throw new BadRequestError(
        "Clinica backfill is currently running; sync will run on its next scheduled attempt",
      );
    }

    isSyncRunning = true;
    lastSyncError = null;

    try {
      validateClinicaSyncEnv();

      return await action();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastSyncError = {
        name: err.name,
        message: err.message,
        occurredAt: new Date(),
      };

      logger.error("Clinica sync failed", {
        module: MODULE,
        event: "clinica_sync_failed",
        error_name: err.name,
        error_message: err.message,
        error_stack: err.stack,
      });

      throw error;
    } finally {
      isSyncRunning = false;
      releaseClinicaScrapeLock("daily-sync");
    }
  }

  // Daily cron target: pulls only the clients Clinica has that we don't yet.
  async syncClients(): Promise<SyncClinicaClientsResult> {
    return this.runGuardedSync(async () => {
      const apiPull = await runClinicaDiffSync();
      const result = {
        totalFromClinica: apiPull.rowsSeen,
        created: apiPull.inserted,
        updated: apiPull.updated,
        skipped: apiPull.skipped,
        syncedAt: new Date(),
      };

      logger.info("Clinica diff sync finished", {
        module: MODULE,
        event: "clinica_diff_sync_finished",
        ...result,
      });

      return result;
    });
  }

  // Manual "sync now" button: refreshes the 20 most recently active clients.
  async syncLatestClients(): Promise<SyncClinicaClientsResult> {
    return this.runGuardedSync(async () => {
      const apiPull = await runClinicaLatestSync();
      const result = {
        totalFromClinica: apiPull.rowsSeen,
        created: apiPull.inserted,
        updated: apiPull.updated,
        skipped: apiPull.skipped,
        syncedAt: new Date(),
      };

      logger.info("Clinica latest sync finished", {
        module: MODULE,
        event: "clinica_latest_sync_finished",
        ...result,
      });

      return result;
    });
  }

  // Per-row "update client" button: refreshes exactly one client.
  async syncOneClient(
    externalPatientId: string,
  ): Promise<{ found: boolean; outcome?: string }> {
    return this.runGuardedSync(async () => {
      const result = await runClinicaSingleClientSync(externalPatientId);

      if (!result.found) {
        throw new NotFoundError("Clinica client not found");
      }

      logger.info("Clinica single client sync finished", {
        module: MODULE,
        event: "clinica_single_client_sync_finished",
        externalPatientId,
        outcome: result.outcome,
      });

      return result;
    });
  }

  async getClients(params: GetClinicaClientsParams) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const query = buildSearchQuery(params.search);

    const [items, total] = await Promise.all([
      ClinicaClientModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClinicaClientModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClientByExternalPatientId(externalPatientId: string) {
    const cleanExternalPatientId = normalizeValue(externalPatientId);

    if (!cleanExternalPatientId) {
      throw new BadRequestError("External patient id is required");
    }

    const client = await ClinicaClientModel.findOne({
      externalPatientId: cleanExternalPatientId,
    }).lean();

    if (!client) {
      throw new NotFoundError("Clinica client not found");
    }

    return client;
  }
}

export const clinicaClientService = new ClinicaClientService();
