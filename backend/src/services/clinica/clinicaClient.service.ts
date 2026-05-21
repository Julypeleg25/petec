import type { QueryFilter } from "mongoose";
import { ClinicaClientModel } from "../../models/clinicaClient/index.js";
import type {
  ClinicaClientPet,
  ClinicaClientDocument,
  IClinicaClient,
} from "../../models/clinicaClient/index.js";
import { clinicaScraperService } from "../clinicaScraper.service.js";
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

let isSyncRunning = false;

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

class ClinicaClientService {
  getSyncStatus() {
    return {
      isSyncRunning,
    };
  }

  async syncClients(): Promise<SyncClinicaClientsResult> {
    if (isSyncRunning) {
      throw new BadRequestError("Clinica sync is already running");
    }

    isSyncRunning = true;

    try {
      logger.info("Clinica clients sync started", {
        module: MODULE,
        event: "clinica_clients_sync_started",
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
    } finally {
      await clinicaScraperService.close().catch(() => undefined);
      isSyncRunning = false;
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
