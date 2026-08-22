import type { QueryFilter } from "mongoose";
import { ClinicaClientModel } from "../../models/clinicaClient/index.js";
import type { ClinicaClientDocument } from "../../models/clinicaClient/index.js";
import {
  acquireClinicaScrapeLock,
  getClinicaScrapeLockOwner,
  releaseClinicaScrapeLock,
} from "../../utils/clinicaScrapeLock.js";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../constants/error.constants.js";
import {
  runClinicaDiffSync,
  runClinicaLatestSync,
  runClinicaPetSessionsFetch,
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

type ApiSyncResult = Awaited<ReturnType<typeof runClinicaDiffSync>>;

let isSyncRunning = false;
let lastSyncError: SyncErrorStatus | null = null;
let lastSyncResult: SyncClinicaClientsResult | null = null;
let syncStartedAt: Date | null = null;

const validateClinicaSyncEnv = (): void => {
  const missingEnvNames = [
    !ENV.clinicaBaseUrl ? "CLINICA_URL" : undefined,
    !ENV.clinicUsername ? "CLINIC_USERNAME" : undefined,
    !ENV.clinicPassword ? "CLINIC_PASSWORD" : undefined,
  ].filter(Boolean);

  if (missingEnvNames.length > 0) {
    throw new BadRequestError(
      `חסרים משתני סביבה לחיבור לקליניקה: ${missingEnvNames.join(", ")}`,
    );
  }
};

const normalizeValue = (value?: string): string =>
  value?.trim().replace(/\s+/g, " ") ?? "";

const normalizeMatchText = (value?: string): string =>
  normalizeValue(value)
    .normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳״`.,:;/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL");

const normalizePhone = (value?: string): string => {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.startsWith("972") ? `0${digits.slice(3)}` : digits;
};

const toSyncResult = (apiResult: ApiSyncResult): SyncClinicaClientsResult => ({
  totalFromClinica: apiResult.rowsSeen,
  created: apiResult.inserted,
  updated: apiResult.updated,
  skipped: apiResult.skipped,
  syncedAt: new Date(),
});

const findPetByName = <T extends { name: string }>(
  pets: T[],
  petName: string,
): T | undefined => {
  const normalizedPetName = normalizeMatchText(petName);
  return pets.find(
    (candidate) => normalizeMatchText(candidate.name) === normalizedPetName,
  );
};

const buildSearchQuery = (
  search?: string,
): QueryFilter<ClinicaClientDocument> => {
  const cleanSearch = normalizeValue(search);

  if (!cleanSearch) {
    return {};
  }

  const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return {
    $or: [
      { externalPatientId: { $regex: escapedSearch, $options: "i" } },
      { ownerName: { $regex: escapedSearch, $options: "i" } },
      { ownerPhone: { $regex: escapedSearch, $options: "i" } },
      { "pets.name": { $regex: escapedSearch, $options: "i" } },
    ],
  };
};

class ClinicaClientService {
  getSyncStatus() {
    return {
      isSyncRunning,
      lastSyncError,
      lastSyncResult,
      syncStartedAt,
      lockOwner: getClinicaScrapeLockOwner(),
    };
  }

  private async runGuardedSync<T>(action: () => Promise<T>): Promise<T> {
    if (isSyncRunning) {
      throw new ConflictError("סנכרון הקליניקה כבר מתבצע כעת");
    }

    if (!acquireClinicaScrapeLock("daily-sync")) {
      logger.warn("Clinica operation rejected while lock is held", {
        module: MODULE,
        event: "clinica_lock_conflict",
        requested_owner: "daily-sync",
        current_owner: getClinicaScrapeLockOwner(),
      });
      throw new ConflictError(
        "פעולת קליניקה אחרת מתבצעת כעת. יש לנסות שוב בעוד מספר רגעים",
      );
    }

    isSyncRunning = true;
    lastSyncError = null;
    syncStartedAt = new Date();

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

  async syncClients(): Promise<SyncClinicaClientsResult> {
    const result = await this.runGuardedSync(async () => {
      const apiPull = await runClinicaDiffSync();
      const result = toSyncResult(apiPull);

      logger.info("Clinica diff sync finished", {
        module: MODULE,
        event: "clinica_diff_sync_finished",
        ...result,
      });

      return result;
    });
    lastSyncResult = result;
    return result;
  }

  async syncLatestClients(): Promise<SyncClinicaClientsResult> {
    const result = await this.runGuardedSync(async () => {
      const apiPull = await runClinicaLatestSync();
      const result = toSyncResult(apiPull);

      logger.info("Clinica latest sync finished", {
        module: MODULE,
        event: "clinica_latest_sync_finished",
        ...result,
      });

      return result;
    });
    lastSyncResult = result;
    return result;
  }

  async syncOneClient(
    externalPatientId: string,
  ): Promise<{ found: boolean; outcome?: string }> {
    if (!/^\d+$/.test(normalizeValue(externalPatientId))) {
      throw new BadRequestError("מספר הלקוח חייב לכלול ספרות בלבד");
    }
    validateClinicaSyncEnv();
    if (!acquireClinicaScrapeLock("single-client-sync")) {
      logger.warn("Clinica operation rejected while lock is held", {
        module: MODULE,
        event: "clinica_lock_conflict",
        requested_owner: "single-client-sync",
        current_owner: getClinicaScrapeLockOwner(),
      });
      throw new ConflictError("פעולת קליניקה אחרת מתבצעת כעת. יש לנסות שוב בעוד מספר רגעים");
    }
    try {
      const result = await runClinicaSingleClientSync(externalPatientId);

      if (!result.found) {
        throw new NotFoundError("הלקוח לא נמצא בקליניקה אונליין");
      }

      logger.info("Clinica single client sync finished", {
        module: MODULE,
        event: "clinica_single_client_sync_finished",
        externalPatientId,
        outcome: result.outcome,
      });

      return result;
    } finally {
      releaseClinicaScrapeLock("single-client-sync");
    }
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
      throw new BadRequestError("יש להזין מספר לקוח בקליניקה");
    }

    const client = await ClinicaClientModel.findOne({
      externalPatientId: cleanExternalPatientId,
    }).lean();

    if (!client) {
      throw new NotFoundError("הלקוח לא נמצא בקליניקה אונליין");
    }

    return client;
  }

  async findClientForCasePrefix(
    casePrefix: string,
    petName: string,
    ownerPhone?: string,
  ) {
    const prefix = normalizeValue(casePrefix).split(/[-\u2013\u2014]/)[0] ?? "";
    const normalizedPetName = normalizeMatchText(petName);
    if (!prefix || !normalizedPetName) {
      throw new BadRequestError("יש להזין מספר תיק ושם חיה");
    }
    const phone = normalizePhone(ownerPhone);
    const candidates = await ClinicaClientModel.find({
      $or: [
        { externalPatientId: prefix },
        { "pets.externalPatientId": prefix },
        ...(phone ? [{ ownerPhone: { $regex: `${phone.slice(-7)}$` } }] : []),
      ],
    }).lean();
    const client = candidates.find((candidate) =>
      findPetByName(candidate.pets, petName),
    );
    if (!client) throw new NotFoundError("לא נמצאה חיה תואמת בקליניקה אונליין");
    return client;
  }

  async getCachedPet(clientId: string, petName: string) {
    const client = await ClinicaClientModel.findById(clientId).lean();
    if (!client) throw new NotFoundError("הלקוח לא נמצא בקליניקה אונליין");
    const pet = findPetByName(client.pets, petName);
    if (!pet) throw new NotFoundError("החיה לא נמצאה בקליניקה אונליין");
    return { ...client, pets: [pet] };
  }

  async fetchMissingVisitDetails(
    clientId: string,
    petName: string,
  ) {
    let client = await ClinicaClientModel.findById(clientId).lean();
    if (!client) throw new NotFoundError("הלקוח לא נמצא בקליניקה אונליין");
    let pet = findPetByName(client.pets, petName);
    if (!pet) throw new NotFoundError("החיה לא נמצאה בקליניקה אונליין");

    if (!pet.externalPatientId && client.externalPatientId) {
      await this.syncOneClient(client.externalPatientId);
      client = await ClinicaClientModel.findById(clientId).lean();
      pet = client ? findPetByName(client.pets, petName) : undefined;
    }
    if (!client || !pet) throw new NotFoundError("החיה לא נמצאה בקליניקה אונליין");
    if (!pet.externalPatientId) {
      throw new BadRequestError("לחיה חסר מזהה בקליניקה אונליין");
    }

    if (!acquireClinicaScrapeLock("pet-sessions")) {
      logger.warn("Clinica operation rejected while lock is held", {
        module: MODULE,
        event: "clinica_lock_conflict",
        requested_owner: "pet-sessions",
        current_owner: getClinicaScrapeLockOwner(),
      });
      throw new ConflictError("פעולת קליניקה אחרת מתבצעת כעת. יש לנסות שוב בעוד מספר רגעים");
    }
    let visits;
    try {
      visits = await runClinicaPetSessionsFetch(
        pet.externalPatientId,
        pet.name,
      );
    } finally {
      releaseClinicaScrapeLock("pet-sessions");
    }
    return { ...client, pets: [pet], visits };
  }

  async fetchVisitsForExistingCase(
    casePrefix: string,
    petName: string,
    ownerPhone?: string,
  ) {
    let client;
    try {
      client = await this.findClientForCasePrefix(casePrefix, petName, ownerPhone);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      const prefix = normalizeValue(casePrefix).split(/[-\u2013\u2014]/)[0] ?? "";
      if (prefix) await this.syncOneClient(prefix);
      client = await this.findClientForCasePrefix(casePrefix, petName, ownerPhone);
    }
    return this.fetchMissingVisitDetails(client._id.toString(), petName);
  }
}

export const clinicaClientService = new ClinicaClientService();
