import type { QueryFilter } from "mongoose";
import { ClinicaClientModel } from "../../models/clinicaClient/index.js";
import type {
  ClinicaClientPet,
  ClinicaClientDocument,
  IClinicaClient,
} from "../../models/clinicaClient/index.js";
import { clinicaScraperService } from "../clinicaScraper.service.js";
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

type ClinicaClientObject = ReturnType<ClinicaClientDocument["toObject"]>;

let isSyncRunning = false;
let lastSyncError: SyncErrorStatus | null = null;
let lastSyncResult: SyncClinicaClientsResult | null = null;
let syncStartedAt: Date | null = null;

const FULL_SYNC_SCRAPE_TIMEOUT_MS = 3 * 60 * 1000;
const TARGETED_SCRAPE_TIMEOUT_MS = 2 * 60 * 1000;
const SCRAPER_CLOSE_TIMEOUT_MS = 15 * 1000;
const PERSISTENCE_WORKER_COUNT = 8;
const CLINICA_VISIT_DATE_PATTERN = /\b\d{1,2}[./-]\d{1,2}[./-](?:\d{4}|\d{2})(?=\D|$|\d{1,2}:)/;

export const isClinicaVisitRow = (row: string[]): boolean =>
  CLINICA_VISIT_DATE_PATTERN.test(row.join(" "));

// The scraper owns a single browser. Serialize browser lifecycles, but do not
// reject an on-demand patient request merely because a scheduled sync is using
// it. Each scrape is bounded, so a failed Clinica page cannot block the queue
// forever.
let scraperQueue: Promise<void> = Promise.resolve();
const inFlightTargetedFetches = new Map<
  string,
  Promise<ClinicaClientObject>
>();
const clientWriteQueues = new Map<string, Promise<void>>();

const withClientWriteLock = async <T>(
  clientId: string,
  task: () => Promise<T>,
): Promise<T> => {
  const precedingWrite = clientWriteQueues.get(clientId) ?? Promise.resolve();
  let releaseWrite!: () => void;
  const currentWrite = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });
  clientWriteQueues.set(clientId, currentWrite);

  await precedingWrite;
  try {
    return await task();
  } finally {
    releaseWrite();
    if (clientWriteQueues.get(clientId) === currentWrite) {
      clientWriteQueues.delete(clientId);
    }
  }
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const useScraper = async <T>(
  task: () => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const precedingTask = scraperQueue;
  let releaseQueue!: () => void;
  scraperQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await precedingTask;

  try {
    validateClinicaSyncEnv();
    await clinicaScraperService.init();
    return await withTimeout(
      task(),
      timeoutMs,
      `Clinica scraping timed out after ${Math.round(timeoutMs / 1000)} seconds`,
    );
  } finally {
    try {
      await withTimeout(
        clinicaScraperService.close(),
        SCRAPER_CLOSE_TIMEOUT_MS,
        "Clinica browser close timed out",
      );
    } catch (error) {
      logger.warn("Clinica scraper could not be closed cleanly", {
        module: MODULE,
        event: "clinica_scraper_close_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      releaseQueue();
    }
  }
};

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

const normalizePhone = (value?: string): string => {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (digits.startsWith("972") && digits.length >= 11) {
    return `0${digits.slice(3)}`;
  }

  return digits;
};

const normalizeMatchText = (value?: string): string =>
  normalizeValue(value)
    .normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳״`.,:;/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL");

const buildClientKey = (
  ownerName: string,
  ownerPhone: string,
  externalClientId?: string,
): string => {
  const cleanPhone = normalizePhone(ownerPhone);
  if (cleanPhone) {
    return `owner:${normalizeMatchText(ownerName)}-${cleanPhone}`;
  }

  const cleanExternalClientId = normalizeValue(externalClientId);
  return cleanExternalClientId
    ? `external:${cleanExternalClientId}`
    : `owner:${normalizeMatchText(ownerName)}`;
};

const sanitizeTextDetail = (value?: string): string | undefined => {
  const cleanValue = normalizeValue(value);

  if (
    !cleanValue ||
    cleanValue.length > 120 ||
    /:\s*$/.test(cleanValue)
  ) {
    return undefined;
  }

  return cleanValue;
};

const sanitizeGender = (value?: string): string | undefined => {
  const cleanValue = sanitizeTextDetail(value);
  if (!cleanValue) return undefined;

  const normalized = normalizeMatchText(cleanValue);
  const containsMale = /(?:^|\s)(?:\u05d6\u05db\u05e8|male)(?:\s|$)/iu.test(normalized);
  const containsFemale = /(?:^|\s)(?:\u05e0\u05e7\u05d1\u05d4|female)(?:\s|$)/iu.test(normalized);

  return containsMale && containsFemale ? undefined : cleanValue;
};

const sanitizeBreed = (value?: string): string | undefined => {
  const cleanValue = sanitizeTextDetail(value);
  if (!cleanValue) return undefined;

  const normalized = normalizeMatchText(cleanValue);
  if (
    /^(?:\u05de\u05d9\u05df|sex|gender)(?:\s|$)/iu.test(normalized) ||
    /^(?:\u05d4?\u05d7\u05d9\u05d4|animal)(?:\s|$)/iu.test(normalized)
  ) {
    return undefined;
  }

  return cleanValue;
};

const sanitizeSpecies = (value?: string): string | undefined => {
  const cleanValue = sanitizeTextDetail(value);
  if (!cleanValue) return undefined;

  const normalized = normalizeMatchText(cleanValue);
  if (
    /^(?:\u05e1\u05d5\u05d2\s*)?(?:\u05d4?\u05d7\u05d9\u05d4)?$/u.test(normalized) ||
    /^(?:\u05de\u05d9\u05df|sex|gender)(?:\s|$)/iu.test(normalized)
  ) {
    return undefined;
  }

  return cleanValue;
};

const sanitizeWeight = (value?: number): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 300
    ? value
    : undefined;

const sanitizeAgeYears = (value?: number): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 80
    ? value
    : undefined;

const sanitizeAgeMonths = (value?: number): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 11
    ? value
    : undefined;

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
  const ownerName = normalizeValue(patient.owner.name);
  const fallbackDetails = extractPetDetailsFromRecords(item);

  if (!petName || petName.toLocaleLowerCase("he-IL") === ownerName.toLocaleLowerCase("he-IL")) {
    return null;
  }

  return {
    externalPatientId: normalizeValue(patient.externalPatientId) || undefined,
    name: petName,
    gender: sanitizeGender(patient.gender),
    breed: sanitizeBreed(patient.breed),
    species: sanitizeSpecies(patient.species),
    color: sanitizeTextDetail(patient.color),
    weightKg: sanitizeWeight(patient.weightKg ?? fallbackDetails.weightKg),
    ageYears: sanitizeAgeYears(patient.ageYears),
    ageMonths: sanitizeAgeMonths(patient.ageMonths),
    insurance: sanitizeTextDetail(patient.insurance),
    treatingDoctor: sanitizeTextDetail(patient.treatingDoctor),
    referringDoctor: sanitizeTextDetail(patient.referringDoctor),
    medicalRecords: item.medicalRecords,
  };
};

export const mapAggregatesToClients = (
  aggregates: ImportedClinicaAggregate[],
): IClinicaClient[] => {
  const groupedClients = new Map<string, IClinicaClient>();

  for (const item of aggregates) {
    const ownerName = normalizeValue(item.patient.owner.name);
    const ownerPhone = normalizePhone(item.patient.owner.phone);
    // externalPatientId on the client document is the Clinica client/case id.
    // A pet id must never be promoted into this field: doing so breaks normal
    // PETEC case-prefix matching and can collide with another client.
    const externalPatientId = normalizeValue(item.patient.externalClientId);
    const pet = mapPatientToPet(item);

    if (!ownerName || (!ownerPhone && !externalPatientId)) {
      continue;
    }

    const key = buildClientKey(ownerName, ownerPhone, externalPatientId);
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

    if (externalPatientId && !existingClient.externalPatientId) {
      existingClient.externalPatientId = externalPatientId;
    }

    if (pet) {
      const petIndex = findMatchingPetIndex(existingClient.pets, pet);
      if (petIndex >= 0) {
        existingClient.pets[petIndex] = mergePet(
          existingClient.pets[petIndex],
          pet,
        );
      } else {
        existingClient.pets.push(pet);
      }

      const recordsCount = Number(existingClient.rawData.recordsCount ?? 0);
      existingClient.rawData.recordsCount =
        recordsCount + item.medicalRecords.length;
    }
  }

  return Array.from(groupedClients.values());
};

const sanitizePet = (pet: ClinicaClientPet): ClinicaClientPet => ({
  ...pet,
  gender: sanitizeGender(pet.gender),
  breed: sanitizeBreed(pet.breed),
  species: sanitizeSpecies(pet.species),
  color: sanitizeTextDetail(pet.color),
  weightKg: sanitizeWeight(pet.weightKg),
  ageYears: sanitizeAgeYears(pet.ageYears),
  ageMonths: sanitizeAgeMonths(pet.ageMonths),
  insurance: sanitizeTextDetail(pet.insurance),
  treatingDoctor: sanitizeTextDetail(pet.treatingDoctor),
  referringDoctor: sanitizeTextDetail(pet.referringDoctor),
});

const mergePet = (
  existingPet: ClinicaClientPet | undefined,
  incomingPet: ClinicaClientPet,
): ClinicaClientPet => {
  const cleanExistingPet = existingPet ? sanitizePet(existingPet) : undefined;
  const cleanIncomingPet = sanitizePet(incomingPet);

  return {
    ...cleanExistingPet,
    ...cleanIncomingPet,
    gender: cleanIncomingPet.gender ?? cleanExistingPet?.gender,
    breed: cleanIncomingPet.breed ?? cleanExistingPet?.breed,
    species: cleanIncomingPet.species ?? cleanExistingPet?.species,
    color: cleanIncomingPet.color ?? cleanExistingPet?.color,
    weightKg: cleanIncomingPet.weightKg ?? cleanExistingPet?.weightKg,
    ageYears: cleanIncomingPet.ageYears ?? cleanExistingPet?.ageYears,
    ageMonths: cleanIncomingPet.ageMonths ?? cleanExistingPet?.ageMonths,
    insurance: cleanIncomingPet.insurance ?? cleanExistingPet?.insurance,
    treatingDoctor:
      cleanIncomingPet.treatingDoctor ?? cleanExistingPet?.treatingDoctor,
    referringDoctor:
      cleanIncomingPet.referringDoctor ?? cleanExistingPet?.referringDoctor,
    medicalRecords: mergeMedicalRecords(
      cleanExistingPet?.medicalRecords ?? [],
      cleanIncomingPet.medicalRecords ?? [],
    ),
    externalPatientId:
      cleanIncomingPet.externalPatientId ?? cleanExistingPet?.externalPatientId,
  };
};

const mergeMedicalRecords = (
  existingRecords: NonNullable<ClinicaClientPet["medicalRecords"]>,
  incomingRecords: NonNullable<ClinicaClientPet["medicalRecords"]>,
): NonNullable<ClinicaClientPet["medicalRecords"]> => {
  const merged = [...existingRecords];

  for (const incoming of incomingRecords) {
    const index = merged.findIndex(
      (existing) =>
        existing.recordType === incoming.recordType &&
        normalizeMatchText(existing.patientName) ===
          normalizeMatchText(incoming.patientName),
    );
    if (index < 0) {
      merged.push(incoming);
      continue;
    }

    const existing = merged[index];
    const isVisitRecord = incoming.recordType === "visitDetails";
    const existingRows = existing.table?.rows ?? [];
    const incomingRows = incoming.table?.rows ?? [];
    const table = isVisitRecord
      ? {
          headers:
            incoming.table?.headers?.length
              ? incoming.table.headers
              : existing.table?.headers ?? [],
          // Visits are historical. Unioning complete rows protects cached
          // history when Clinica returns a partially rendered grid, while new
          // rows from the live response stay first in its original order.
          rows: [...incomingRows, ...existingRows]
            .filter(isClinicaVisitRow)
            .filter(
              (row, rowIndex, rows) =>
                rows.findIndex(
                  (candidate) => JSON.stringify(candidate) === JSON.stringify(row),
                ) === rowIndex,
            ),
        }
      : incoming.table ?? existing.table;

    merged[index] = {
      ...existing,
      ...incoming,
      rawText: incoming.rawText.trim() || existing.rawText,
      table:
        table && table.headers.length > 0 && table.rows.length > 0
          ? table
          : existing.table,
    };
  }

  return merged;
};

const findMatchingPetIndex = (
  pets: ClinicaClientPet[],
  incomingPet: ClinicaClientPet,
): number => {
  if (incomingPet.externalPatientId) {
    const idMatch = pets.findIndex(
      (pet) => pet.externalPatientId === incomingPet.externalPatientId,
    );
    if (idMatch >= 0) return idMatch;

    // A name fallback is safe only for an older cached pet that has no id.
    // Never combine two distinct Clinica pet ids merely because the animals
    // share a name under the same owner.
    return pets.findIndex(
      (pet) =>
        !pet.externalPatientId &&
        normalizeMatchText(pet.name) === normalizeMatchText(incomingPet.name),
    );
  }

  return pets.findIndex(
    (pet) =>
      normalizeMatchText(pet.name) === normalizeMatchText(incomingPet.name),
  );
};

const mergePets = (
  existingPets: ClinicaClientPet[],
  incomingPets: ClinicaClientPet[],
): ClinicaClientPet[] => {
  if (incomingPets.length === 0) {
    return existingPets;
  }

  const mergedPets = [...existingPets];

  for (const incomingPet of incomingPets) {
    const existingPetIndex = findMatchingPetIndex(mergedPets, incomingPet);

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

  const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return {
    $or: [
      { externalPatientId: { $regex: escapedSearch, $options: "i" } },
      { "pets.externalPatientId": { $regex: escapedSearch, $options: "i" } },
      { ownerName: { $regex: escapedSearch, $options: "i" } },
      { ownerPhone: { $regex: escapedSearch, $options: "i" } },
      { "pets.name": { $regex: escapedSearch, $options: "i" } },
    ],
  };
};

type PersistClientOutcome = "created" | "updated" | "skipped";

let persistenceIndexesPromise: Promise<void> | null = null;

const ensureClinicaPersistenceIndexes = async (): Promise<void> => {
  if (persistenceIndexesPromise) return persistenceIndexesPromise;

  persistenceIndexesPromise = (async () => {
    const indexes = await ClinicaClientModel.collection.indexes();
    const legacyOwnerIndex = indexes.find((index) => {
      const keys = Object.entries(index.key ?? {});
      return index.unique === true &&
        keys.length === 2 &&
        index.key.ownerName === 1 &&
        index.key.ownerPhone === 1 &&
        index.name !== "clinica_owner_phone_unique_nonempty_v2";
    });

    if (legacyOwnerIndex?.name) {
      await ClinicaClientModel.collection.dropIndex(legacyOwnerIndex.name);
    }

    await ClinicaClientModel.collection.createIndex(
      { ownerName: 1, ownerPhone: 1 },
      {
        unique: true,
        name: "clinica_owner_phone_unique_nonempty_v2",
        partialFilterExpression: { ownerPhone: { $gt: "" } },
      },
    );
  })().catch((error) => {
    persistenceIndexesPromise = null;
    throw error;
  });

  return persistenceIndexesPromise;
};

const findExistingClient = async (
  client: IClinicaClient,
): Promise<ClinicaClientDocument | null> => {
  const petIds = client.pets
    .map((pet) => normalizeValue(pet.externalPatientId))
    .filter(Boolean);
  const filters: QueryFilter<ClinicaClientDocument>[] = [];

  if (client.externalPatientId) {
    filters.push({ externalPatientId: client.externalPatientId });
  }
  if (petIds.length > 0) {
    filters.push({ "pets.externalPatientId": { $in: petIds } });
  }
  if (client.ownerPhone) {
    filters.push({ ownerName: client.ownerName, ownerPhone: client.ownerPhone });
    // Include legacy rows whose phone was stored with punctuation. Candidates
    // are still verified using canonical name + phone below.
    filters.push({ ownerName: client.ownerName });
  }

  const candidates = await ClinicaClientModel.find({ $or: filters });
  if (candidates.length === 0) return null;

  const petIdSet = new Set(petIds);
  return candidates
    .map((candidate) => {
      const sharedPetId = candidate.pets.some(
        (pet) => pet.externalPatientId && petIdSet.has(pet.externalPatientId),
      );
      const sameClientId = Boolean(
        client.externalPatientId &&
        candidate.externalPatientId === client.externalPatientId,
      );
      const sameOwner =
        Boolean(client.ownerPhone) &&
        normalizeMatchText(candidate.ownerName) ===
          normalizeMatchText(client.ownerName) &&
        normalizePhone(candidate.ownerPhone) === normalizePhone(client.ownerPhone);
      const exactStoredOwner =
        Boolean(client.ownerPhone) &&
        candidate.ownerName === client.ownerName &&
        candidate.ownerPhone === client.ownerPhone;

      return {
        candidate,
        score: sameClientId
          ? 4
          : sharedPetId
            ? 3
            : exactStoredOwner
              ? 2
              : sameOwner
                ? 1
                : 0,
      };
    })
    .sort((left, right) => right.score - left.score)
    .find((entry) => entry.score > 0)?.candidate ?? null;
};

const persistMappedClientUnlocked = async (
  client: IClinicaClient,
): Promise<{ outcome: PersistClientOutcome; client: ClinicaClientDocument | null }> => {
  if (
    !client.ownerName ||
    (!client.ownerPhone && !client.externalPatientId) ||
    client.pets.length === 0
  ) {
    return { outcome: "skipped", client: null };
  }

  await ensureClinicaPersistenceIndexes();

  const existingClient = await findExistingClient(client);
  if (!existingClient) {
    const createdClient = await ClinicaClientModel.create(client);
    return { outcome: "created", client: createdClient };
  }

  return withClientWriteLock(existingClient._id.toString(), async () => {
    const latestClient = await ClinicaClientModel.findById(existingClient._id);
    if (!latestClient) {
      return { outcome: "skipped" as const, client: null };
    }

    const latestClientData = latestClient.toObject();
    const existingPets = (latestClientData.pets as ClinicaClientPet[]).filter(
      (pet: ClinicaClientPet) =>
        normalizeMatchText(pet.name) !== normalizeMatchText(client.ownerName),
    );

    latestClient.externalPatientId =
      client.externalPatientId ?? latestClient.externalPatientId;
    latestClient.ownerName = client.ownerName;
    latestClient.ownerPhone = client.ownerPhone || latestClient.ownerPhone;
    latestClient.pets = mergePets(existingPets, client.pets);
    const existingRawData = latestClientData.rawData ?? {};
    const incomingRawData = client.rawData ?? {};
    const incomingHasMedicalData = client.pets.some(
      (pet) => (pet.medicalRecords?.length ?? 0) > 0,
    );
    latestClient.rawData = {
      ...existingRawData,
      ...incomingRawData,
      recordsCount: Math.max(
        Number(existingRawData.recordsCount ?? 0),
        Number(incomingRawData.recordsCount ?? 0),
      ),
      // Directory-only syncs must not replace the last complete targeted raw
      // payload with an empty medical snapshot.
      original:
        incomingHasMedicalData || !existingRawData.original
          ? incomingRawData.original
          : existingRawData.original,
      directory: incomingRawData.original,
    };
    latestClient.lastSyncedAt = new Date();
    latestClient.markModified("pets");
    latestClient.markModified("rawData");
    await latestClient.save();

    return { outcome: "updated" as const, client: latestClient };
  });
};

const persistMappedClient = async (
  client: IClinicaClient,
): Promise<{ outcome: PersistClientOutcome; client: ClinicaClientDocument | null }> =>
  withClientWriteLock(
    `identity:${buildClientKey(
      client.ownerName,
      client.ownerPhone,
      client.externalPatientId,
    )}`,
    () => persistMappedClientUnlocked(client),
  );

const persistClientsConcurrently = async (
  clients: IClinicaClient[],
): Promise<Pick<SyncClinicaClientsResult, "created" | "updated" | "skipped">> => {
  const counts = { created: 0, updated: 0, skipped: 0 };
  let nextClientIndex = 0;
  const workerCount = Math.min(PERSISTENCE_WORKER_COUNT, clients.length);

  const runWorker = async (): Promise<void> => {
    while (nextClientIndex < clients.length) {
      const client = clients[nextClientIndex++];
      const { outcome } = await persistMappedClient(client);
      counts[outcome] += 1;
    }
  };

  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );

  return counts;
};

class ClinicaClientService {
  getSyncStatus() {
    return {
      isSyncRunning,
      lastSyncError,
      lastSyncResult,
      syncStartedAt,
    };
  }

  startSyncClients() {
    if (isSyncRunning) {
      return this.getSyncStatus();
    }

    // syncClients sets isSyncRunning before its first await, so a second
    // request cannot start another browser while this promise is detached.
    void this.syncClients().catch(() => undefined);
    return this.getSyncStatus();
  }

  async syncClients(): Promise<SyncClinicaClientsResult> {
    if (isSyncRunning) {
      throw new BadRequestError("Clinica sync is already running");
    }

    isSyncRunning = true;
    lastSyncError = null;
    syncStartedAt = new Date();

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

      // A full sync indexes the Clinica directory only. Scraping five medical
      // tabs for every pet made a 1,000-pet sync effectively unbounded. Full
      // details and visits are fetched and cached by the targeted endpoints.
      const aggregates = await useScraper(
        () => clinicaScraperService.scrapeClients({ includeMedicalRecords: false }),
        FULL_SYNC_SCRAPE_TIMEOUT_MS,
      );

      logger.info("Clinica scraper returned aggregates", {
        module: MODULE,
        event: "clinica_scraper_returned_aggregates",
        aggregatesCount: aggregates.length,
      });

      const clients = mapAggregatesToClients(aggregates);

      if (clients.length === 0) {
        throw new BadRequestError("Clinica sync returned no clients");
      }

      const { created, updated, skipped } =
        await persistClientsConcurrently(clients);

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

      lastSyncResult = result;

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
      $or: [
        { externalPatientId: cleanExternalPatientId },
        { "pets.externalPatientId": cleanExternalPatientId },
      ],
    }).lean();

    if (!client) {
      throw new NotFoundError("Clinica client not found");
    }

    return client;
  }

  async findClientForCasePrefix(
    casePrefix: string,
    petName: string,
    ownerPhone?: string,
  ) {
    const cleanPrefix =
      normalizeValue(casePrefix).split(/[-\u2013\u2014]/)[0]?.trim() ?? "";
    const cleanPetName = normalizeValue(petName);
    if (!cleanPrefix || !cleanPetName) {
      throw new BadRequestError("Case prefix and pet name are required");
    }

    const normalizedPetName = normalizeMatchText(cleanPetName);
    let clients = await ClinicaClientModel.find({
      externalPatientId: cleanPrefix,
    }).lean();
    let client = clients.find((candidate) =>
      candidate.pets.some(
        (pet) => normalizeMatchText(pet.name) === normalizedPetName,
      ),
    );

    // Compatibility for older external-created cases that stored a Clinica
    // pet id as their case id. Master client id is always preferred above.
    if (!client) {
      clients = await ClinicaClientModel.find({
        "pets.externalPatientId": cleanPrefix,
      }).lean();
      client = clients.find((candidate) =>
        candidate.pets.some(
          (pet) => normalizeMatchText(pet.name) === normalizedPetName,
        ),
      );
    }

    const cleanOwnerPhone = normalizePhone(ownerPhone);
    if (!client && cleanOwnerPhone.length >= 7) {
      const phoneSuffix = cleanOwnerPhone.slice(-7);
      const flexiblePhonePattern = phoneSuffix
        .split("")
        .map((digit) => `${digit}\\D*`)
        .join("");
      clients = await ClinicaClientModel.find({
        ownerPhone: { $regex: `${flexiblePhonePattern}$` },
      }).lean();
      client = clients.find((candidate) =>
        normalizePhone(candidate.ownerPhone) === cleanOwnerPhone &&
        candidate.pets.some(
          (pet) => normalizeMatchText(pet.name) === normalizedPetName,
        ),
      );
    }

    if (!client) throw new NotFoundError("Clinica patient match not found");
    return client;
  }

  async fetchVisitsForExistingCase(
    casePrefix: string,
    petName: string,
    ownerPhone?: string,
  ) {
    const masterCaseId =
      normalizeValue(casePrefix).split(/[-\u2013\u2014]/)[0]?.trim() ?? "";
    let matchedClient;
    try {
      matchedClient = await this.findClientForCasePrefix(
        masterCaseId,
        petName,
        ownerPhone,
      );
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      matchedClient = null;
    }

    if (!matchedClient) {
      const aggregate = await useScraper(
        () => clinicaScraperService.scrapeCasePet({
          casePrefix: masterCaseId,
          petName,
          ownerPhone,
        }),
        TARGETED_SCRAPE_TIMEOUT_MS,
      );
      if (!aggregate) throw new NotFoundError("Clinica patient match not found");

      const importedClient = mapAggregatesToClients([aggregate])[0];
      if (!importedClient) throw new NotFoundError("Clinica patient match not found");

      const persisted = await persistMappedClient(importedClient);
      if (!persisted.client) {
        throw new NotFoundError("Clinica patient match not found");
      }

      // scrapeCasePet already performed the targeted medical-tab fetch. Return
      // its merged result instead of immediately opening a second browser when
      // Clinica legitimately has no visit rows.
      return persisted.client.toObject();
    }

    return this.fetchMissingVisitDetails(
      matchedClient._id.toString(),
      petName,
    );
  }

  async fetchMissingVisitDetails(
    clientId: string,
    petName: string,
    forcePatientDetails = false,
  ) {
    const cleanPetName = normalizeValue(petName);
    if (!cleanPetName) {
      throw new BadRequestError("Clinica pet name is required");
    }
    const client = await ClinicaClientModel.findById(clientId);
    if (!client) throw new NotFoundError("Clinica client not found");

    const petIndex = client.pets.findIndex(
      (pet) => normalizeMatchText(pet.name) === normalizeMatchText(cleanPetName),
    );
    if (petIndex < 0) throw new NotFoundError("Clinica pet not found");

    const existingVisit = client.pets[petIndex]?.medicalRecords?.find(
      (record) =>
        record.recordType === "visitDetails" &&
        record.table?.rows?.some(isClinicaVisitRow),
    );
    // Case pages only need the visit history. Once it has been cached, never
    // launch another browser scrape merely because an unrelated demographic
    // field is absent. The Clinica import form explicitly opts into a full
    // patient-details refresh via forcePatientDetails.
    if (!forcePatientDetails && existingVisit) return client.toObject();

    const fetchKey = [
      clientId,
      normalizeMatchText(cleanPetName),
    ].join(":");
    const existingFetch = inFlightTargetedFetches.get(fetchKey);
    if (existingFetch) return existingFetch;

    const fetchPromise = (async (): Promise<ClinicaClientObject> => {
      const pet = client.pets[petIndex];
      const {
        externalPatientId: scrapedExternalPatientId,
        records,
        details,
      } = await useScraper(
        () => clinicaScraperService.scrapePetMedicalRecords({
          externalClientId: client.externalPatientId,
          externalPatientId: pet.externalPatientId,
          ownerName: client.ownerName,
          ownerPhone: client.ownerPhone,
          petName: pet.name,
        }),
        TARGETED_SCRAPE_TIMEOUT_MS,
      );

      return withClientWriteLock(clientId, async () => {
        // A directory sync can update this document while the browser request
        // is queued or running. Reload inside the write lock before saving so
        // neither response overwrites the other's pet ids or cached records.
        const latestClient = await ClinicaClientModel.findById(clientId);
        if (!latestClient) throw new NotFoundError("Clinica client not found");
        const resolvedPetId = scrapedExternalPatientId ?? pet.externalPatientId;
        const latestPetIndex = resolvedPetId
          ? latestClient.pets.findIndex(
              (candidate) =>
                candidate.externalPatientId === resolvedPetId,
            )
          : -1;
        const matchedPetIndex = latestPetIndex >= 0
          ? latestPetIndex
          : latestClient.pets.findIndex(
              (candidate) =>
                normalizeMatchText(candidate.name) ===
                normalizeMatchText(pet.name),
            );
        if (matchedPetIndex < 0) {
          throw new NotFoundError("Clinica pet not found");
        }

        latestClient.pets[matchedPetIndex] = mergePet(
          latestClient.pets[matchedPetIndex],
          {
            externalPatientId: resolvedPetId,
            name: pet.name,
            gender: details.gender,
            breed: details.breed,
            species: details.species,
            color: details.color,
            weightKg: details.weightKg,
            ageYears: details.ageYears,
            ageMonths: details.ageMonths,
            insurance: details.insurance,
            treatingDoctor: details.treatingDoctor,
            referringDoctor: details.referringDoctor,
            medicalRecords: records,
          },
        );
        latestClient.lastSyncedAt = new Date();
        latestClient.markModified("pets");
        await latestClient.save();

        return latestClient.toObject();
      });
    })();

    inFlightTargetedFetches.set(fetchKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      if (inFlightTargetedFetches.get(fetchKey) === fetchPromise) {
        inFlightTargetedFetches.delete(fetchKey);
      }
    }
  }
}

export const clinicaClientService = new ClinicaClientService();
