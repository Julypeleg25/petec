import type { QueryFilter } from "mongoose";
import { ClinicaClientModel } from "../../models/clinicaClient/index.js";
import type {
  ClinicaClientPet,
  ClinicaClientDocument,
  IClinicaClient,
} from "../../models/clinicaClient/index.js";
import {
  ClinicaBackfillClientModel,
  type ClinicaBackfillClientDocument,
  type IClinicaBackfillClient,
} from "../../models/clinicaBackfillClient/index.js";
import { clinicaScraperService } from "../clinicaScraper.service.js";
import {
  acquireClinicaScrapeLock,
  releaseClinicaScrapeLock,
} from "../../utils/clinicaScrapeLock.js";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import { BadRequestError, NotFoundError } from "../../constants/error.constants.js";
import type { ImportedClinicaAggregate } from "../../utils/clinica-query.types.js";

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

type PromoteBackfillClientsOptions = {
  minCount?: number;
  dryRun?: boolean;
};

type PromoteBackfillClientsResult = {
  backfillCount: number;
  minCount: number;
  promoted: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  clearedBackfill: boolean;
};

type ClinicaClientListItem = (IClinicaClient & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  sourceTag?: "existing" | "new";
});

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

const buildClientKey = (item: ImportedClinicaAggregate): string => {
  if (item.patient.externalPatientId) {
    return `external:${item.patient.externalPatientId}`;
  }

  return `owner:${item.patient.owner.name}-${item.patient.owner.phone}`;
};

const toNumberValue = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value.replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const extractWeightKg = (text: string): number | undefined => {
  const match =
    text.match(/(?:משקל|weight|wt)[^\d]{0,80}(\d+(?:[.,]\d+)?)/i) ??
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:קילו|קג|ק"ג|ק״ג|kg)/i);

  return toNumberValue(match?.[1]);
};

const extractPetDetailsFromRecords = (
  item: ImportedClinicaAggregate,
): Pick<ClinicaClientPet, "weightKg"> => {
  const rawText = item.medicalRecords
    .map((record) => record.rawText)
    .join("\n");

  if (!rawText.trim()) {
    return {};
  }

  return {
    weightKg: extractWeightKg(rawText),
  };
};

const mapPatientToPet = (
  item: ImportedClinicaAggregate,
): ClinicaClientPet | null => {
  const { patient } = item;
  const petName = normalizeValue(patient.name);
  const fallbackDetails = extractPetDetailsFromRecords(item);

  if (!petName) {
    return null;
  }

  return {
    name: petName,
    gender: normalizeValue(patient.gender) || undefined,
    breed: normalizeValue(patient.breed) || undefined,
    species: normalizeValue(patient.species) || undefined,
    color: normalizeValue(patient.color) || undefined,
    weightKg: patient.weightKg ?? fallbackDetails.weightKg,
    ageYears: patient.ageYears,
    ageMonths: patient.ageMonths,
    insurance: normalizeValue(patient.insurance) || undefined,
    treatingDoctor: normalizeValue(patient.treatingDoctor) || undefined,
    referringDoctor: normalizeValue(patient.referringDoctor) || undefined,
  };
};

const mapAggregatesToClients = (
  aggregates: ImportedClinicaAggregate[],
): IClinicaClient[] => {
  const groupedClients = new Map<string, IClinicaClient>();

  for (const item of aggregates) {
    const ownerName = normalizeValue(item.patient.owner.name);
    const ownerPhone = normalizeValue(item.patient.owner.phone);
    const externalPatientId = normalizeValue(item.patient.externalPatientId);
    const pet = mapPatientToPet(item);

    if (!ownerName || !ownerPhone) {
      continue;
    }

    const key = buildClientKey(item);
    const existingClient = groupedClients.get(key);

    if (!existingClient) {
      groupedClients.set(key, {
        externalPatientId: externalPatientId || undefined,
        ownerName,
        ownerPhone,
        pets: pet ? [pet] : [],
        rawData: {
          source: "clinica-online",
          recordsCount: item.medicalRecords.length,
          original: item,
        },
        lastSyncedAt: new Date(),
      });

      continue;
    }

    const alreadyHasPet = existingClient.pets.some(
      (existingPet) => existingPet.name === pet?.name,
    );

    if (pet && !alreadyHasPet) {
      existingClient.pets.push(pet);
    }
  }

  return Array.from(groupedClients.values());
};

const mergePet = (
  existingPet: ClinicaClientPet | undefined,
  incomingPet: ClinicaClientPet,
): ClinicaClientPet => ({
  ...existingPet,
  ...incomingPet,
  gender: incomingPet.gender ?? existingPet?.gender,
  breed: incomingPet.breed ?? existingPet?.breed,
  species: incomingPet.species ?? existingPet?.species,
  color: incomingPet.color ?? existingPet?.color,
  weightKg: incomingPet.weightKg ?? existingPet?.weightKg,
  ageYears: incomingPet.ageYears ?? existingPet?.ageYears,
  ageMonths: incomingPet.ageMonths ?? existingPet?.ageMonths,
  insurance: incomingPet.insurance ?? existingPet?.insurance,
  treatingDoctor: incomingPet.treatingDoctor ?? existingPet?.treatingDoctor,
  referringDoctor: incomingPet.referringDoctor ?? existingPet?.referringDoctor,
});

const mergePets = (
  existingPets: ClinicaClientPet[],
  incomingPets: ClinicaClientPet[],
): ClinicaClientPet[] => {
  if (incomingPets.length === 0) {
    return existingPets;
  }

  const mergedPets = [...existingPets];

  for (const incomingPet of incomingPets) {
    const existingPetIndex = mergedPets.findIndex(
      (pet) => pet.name === incomingPet.name,
    );

    if (existingPetIndex >= 0) {
      mergedPets[existingPetIndex] = mergePet(
        mergedPets[existingPetIndex],
        incomingPet,
      );
      continue;
    }

    mergedPets.push(incomingPet);
  }

  return mergedPets;
};

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

const buildBackfillSearchQuery = (
  search?: string,
): QueryFilter<ClinicaBackfillClientDocument> => {
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

const toExistingListItem = (
  client: IClinicaClient & { _id: unknown; createdAt?: Date; updatedAt?: Date },
): ClinicaClientListItem => ({
  ...client,
  sourceTag: "existing",
});

const toBackfillListItem = (
  client: IClinicaBackfillClient & {
    _id: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  },
): ClinicaClientListItem => ({
  _id: client._id,
  externalPatientId: client.externalPatientId,
  ownerName: client.ownerName,
  ownerPhone: client.ownerPhone,
  pets: client.pets,
  rawData: client.rawData ?? {},
  lastSyncedAt: client.lastBackfilledAt,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
  sourceTag: "new",
});

const getListItemSortTime = (client: ClinicaClientListItem): number => {
  const date = client.updatedAt ?? client.lastSyncedAt ?? client.createdAt;

  return date ? new Date(date).getTime() : 0;
};

class ClinicaClientService {
  getSyncStatus() {
    return {
      isSyncRunning,
      lastSyncError,
    };
  }

  async syncClients(): Promise<SyncClinicaClientsResult> {
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
      logger.info("Clinica clients sync started", {
        module: MODULE,
        event: "clinica_clients_sync_started",
      });

      logger.info("Clinica sync env validation started", {
        module: MODULE,
        event: "clinica_sync_env_validation_started",
      });

      validateClinicaSyncEnv();

      logger.info("Clinica sync env validation finished", {
        module: MODULE,
        event: "clinica_sync_env_validation_finished",
        hasClinicaBaseUrl: Boolean(ENV.clinicaBaseUrl),
        hasClinicUsername: Boolean(ENV.clinicUsername),
        hasClinicPassword: Boolean(ENV.clinicPassword),
      });

      logger.info("Clinica scraper init started", {
        module: MODULE,
        event: "clinica_scraper_init_started",
      });

      await clinicaScraperService.init();

      logger.info("Clinica scraper init finished", {
        module: MODULE,
        event: "clinica_scraper_init_finished",
      });

      const aggregates = await clinicaScraperService.scrapeClients();

      logger.info("Clinica scraper returned aggregates", {
        module: MODULE,
        event: "clinica_scraper_returned_aggregates",
        aggregatesCount: aggregates.length,
      });

      const clients = mapAggregatesToClients(aggregates);

      if (clients.length === 0) {
        throw new BadRequestError("Clinica sync returned no clients");
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const client of clients) {
        const query = client.externalPatientId
          ? { externalPatientId: client.externalPatientId }
          : {
              ownerName: client.ownerName,
              ownerPhone: client.ownerPhone,
            };

        const existingClient = await ClinicaClientModel.findOne(query);

        if (existingClient) {
          const existingClientData = existingClient.toObject();
          const mergedPets = mergePets(
            existingClientData.pets,
            client.pets,
          );

          await ClinicaClientModel.updateOne(
            { _id: existingClient._id },
            {
              $set: {
                ownerName: client.ownerName,
                ownerPhone: client.ownerPhone,
                pets: mergedPets,
                rawData: client.rawData,
                lastSyncedAt: new Date(),
              },
            },
          );

          updated += 1;
          continue;
        }

        if (!client.ownerName || !client.ownerPhone || client.pets.length === 0) {
          skipped += 1;
          continue;
        }

        await ClinicaClientModel.create(client);
        created += 1;
      }

      const result = {
        totalFromClinica: clients.length,
        created,
        updated,
        skipped,
        syncedAt: new Date(),
      };

      logger.info("Clinica clients sync finished", {
        module: MODULE,
        event: "clinica_clients_sync_finished",
        ...result,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastSyncError = {
        name: err.name,
        message: err.message,
        occurredAt: new Date(),
      };

      logger.error("Clinica clients sync failed", {
        module: MODULE,
        event: "clinica_clients_sync_failed",
        error_name: err.name,
        error_message: err.message,
        error_stack: err.stack,
      });

      throw error;
    } finally {
      logger.info("Clinica scraper close started", {
        module: MODULE,
        event: "clinica_scraper_close_started",
      });

      await clinicaScraperService.close().catch(() => undefined);
      isSyncRunning = false;
      releaseClinicaScrapeLock("daily-sync");

      logger.info("Clinica scraper close finished", {
        module: MODULE,
        event: "clinica_scraper_close_finished",
        isSyncRunning,
      });
    }
  }

  async promoteBackfillClients(
    options: PromoteBackfillClientsOptions = {},
  ): Promise<PromoteBackfillClientsResult> {
    const minCount = options.minCount ?? 2000;
    const dryRun = options.dryRun ?? false;
    const backfillCount = await ClinicaBackfillClientModel.countDocuments({});

    if (backfillCount < minCount) {
      logger.warn("Clinica backfill promotion skipped: below minimum count", {
        module: MODULE,
        event: "clinica_backfill_promotion_skipped",
        backfillCount,
        minCount,
      });

      return {
        backfillCount,
        minCount,
        promoted: false,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        clearedBackfill: false,
      };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const backfillClients = await ClinicaBackfillClientModel.find({}).lean();

    for (const backfillClient of backfillClients) {
      try {
        const ownerName = normalizeValue(backfillClient.ownerName);
        const ownerPhone = normalizeValue(backfillClient.ownerPhone);
        const pets = backfillClient.pets ?? [];

        if (!ownerName || !ownerPhone || pets.length === 0) {
          skipped += 1;
          continue;
        }

        const query = backfillClient.externalPatientId
          ? { externalPatientId: backfillClient.externalPatientId }
          : { ownerName, ownerPhone };

        const existingClient = await ClinicaClientModel.findOne(query);

        if (existingClient) {
          const existingClientData = existingClient.toObject();
          const mergedPets = mergePets(existingClientData.pets, pets);

          if (!dryRun) {
            await ClinicaClientModel.updateOne(
              { _id: existingClient._id },
              {
                $set: {
                  ownerName,
                  ownerPhone,
                  pets: mergedPets,
                  rawData: backfillClient.rawData ?? existingClientData.rawData,
                  lastSyncedAt: new Date(),
                },
              },
            );
          }

          updated += 1;
          continue;
        }

        if (!dryRun) {
          await ClinicaClientModel.create({
            externalPatientId: backfillClient.externalPatientId,
            ownerName,
            ownerPhone,
            pets,
            rawData: backfillClient.rawData ?? {},
            lastSyncedAt: new Date(),
          });
        }

        created += 1;
      } catch (error) {
        failed += 1;
        logger.error("Clinica backfill promotion failed for client", {
          module: MODULE,
          event: "clinica_backfill_promotion_client_failed",
          externalPatientId: backfillClient.externalPatientId,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!dryRun) {
      await ClinicaBackfillClientModel.deleteMany({});
    }

    const result = {
      backfillCount,
      minCount,
      promoted: true,
      created,
      updated,
      skipped,
      failed,
      clearedBackfill: !dryRun,
    };

    logger.info("Clinica backfill promotion finished", {
      module: MODULE,
      event: "clinica_backfill_promotion_finished",
      ...result,
    });

    return result;
  }

  async getClients(params: GetClinicaClientsParams) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const query = buildSearchQuery(params.search);
    const backfillQuery = buildBackfillSearchQuery(params.search);
    const take = skip + limit;

    const [
      existingItems,
      backfillItems,
      existingTotal,
      backfillTotal,
    ] = await Promise.all([
      ClinicaClientModel.find(query)
        .sort({ updatedAt: -1 })
        .limit(take)
        .lean(),
      ClinicaBackfillClientModel.find(backfillQuery)
        .sort({ updatedAt: -1 })
        .limit(take)
        .lean(),
      ClinicaClientModel.countDocuments(query),
      ClinicaBackfillClientModel.countDocuments(backfillQuery),
    ]);
    const items = [
      ...existingItems.map(toExistingListItem),
      ...backfillItems.map(toBackfillListItem),
    ]
      .sort((left, right) => getListItemSortTime(right) - getListItemSortTime(left))
      .slice(skip, skip + limit);
    const total = existingTotal + backfillTotal;

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
