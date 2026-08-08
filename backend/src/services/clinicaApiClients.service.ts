import type { Page } from "playwright";
import {
  CLINICA_API_PATHS,
  CLINICA_LAST_PATIENTS_PAYLOAD,
  CLINICA_LATEST_CLIENT_LIMIT,
  CLINICA_NAVIGATION_TIMEOUT_MS,
  CLINICA_PAGE_TIMEOUT_MS,
} from "../constants/clinicaApi.constants.js";
import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import { clinicaScraperService } from "./clinicaScraper.service.js";
import { ClinicaClientModel } from "../models/clinicaClient/index.js";
import type { ClinicaClientPet } from "../models/clinicaClient/index.js";
import type {
  RegPersonal,
  RegPet,
  RegPetGeneral,
  RegPetSession,
} from "../types/clinicaApi.types.js";
import { mergePets, toPlainClinicaPets } from "../utils/clinicaPetMerge.utils.js";

const MODULE = "clinica-api";
export const LAST_PATIENTS_ENDPOINT_PATH = CLINICA_API_PATHS.lastPatients;
export const LAST_PATIENTS_PAYLOAD = CLINICA_LAST_PATIENTS_PAYLOAD;

export type { RegPersonal, RegPet } from "../types/clinicaApi.types.js";

const normalizeValue = (value?: string | null): string =>
  value?.trim().replace(/\s+/g, " ") ?? "";

const normalizeMultilineValue = (value?: string | null): string =>
  value
    ?.replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^(?:\s*:\s*)+/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() ?? "";

export const formatClinicaDateTime = (value?: string | null): string => {
  const normalized = normalizeValue(value);
  const match = normalized.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i,
  );
  if (!match) return normalized;

  const [, month, day, year, rawHour, minute, second = "00", meridiem] = match;
  if (!rawHour || !minute) return `${Number(day)}/${Number(month)}/${year}`;

  let hour = Number(rawHour);
  if (/PM/i.test(meridiem ?? "") && hour < 12) hour += 12;
  if (/AM/i.test(meridiem ?? "") && hour === 12) hour = 0;

  return `${Number(day)}/${Number(month)}/${year} ${String(hour).padStart(2, "0")}:${minute}:${second}`;
};

const callApi = (
  page: Page,
  url: string,
  body: unknown,
): Promise<{ status: number; text: string }> =>
  page.evaluate(
    async ({ url, body }) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        const text = await res.text();

        return { status: res.status, text };
      } catch (error) {
        return { status: -1, text: String(error) };
      }
    },
    { url, body },
  );

const labeledValue = (label: string, value?: string | null): string => {
  const normalized = normalizeMultilineValue(value);
  return normalized ? `${label}: ${normalized}` : "";
};

const formatSessionDetails = (
  session: RegPetSession,
  branchName?: string,
): string => {
  const items = (session.Items ?? [])
    .map((item) => {
      const name = normalizeValue(item.FieldName);
      const notes = normalizeValue(item.Notes);
      const amount = item.Total && item.Total > 0 ? item.Total : item.Price;
      return [
        name ? `${name}${amount && amount > 0 ? `: ${amount.toFixed(2)}` : ""}` : "",
        notes,
      ].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join(";   ");
  const itemsTotal = (session.Items ?? []).reduce(
    (total, item) => total + (item.Total && item.Total > 0 ? item.Total : 0),
    0,
  );
  const itemsWithTotal = items
    ? `${items}${itemsTotal > 0 ? `; \u05e1\u05d4'\u05db: ${itemsTotal.toFixed(2)}` : ""}`
    : "";
  const doctorAndBranch = [
    labeledValue("\u05d4\u05e8\u05d5\u05e4\u05d0", session.TherapistName),
    labeledValue("\u05e1\u05e0\u05d9\u05e3", session.BranchName || branchName),
  ].filter(Boolean).join("\n");

  return [
    doctorAndBranch,
    labeledValue("\u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4 \u05d5\u05e1\u05d9\u05d1\u05ea \u05d4\u05d1\u05d9\u05e7\u05d5\u05e8", session.Reason),
    labeledValue("\u05de\u05de\u05e6\u05d0\u05d9\u05dd \u05d5\u05d1\u05d3\u05d9\u05e7\u05d5\u05ea", session.Finds),
    labeledValue("\u05d0\u05d1\u05d7\u05e0\u05d4", session.Anamneza),
    labeledValue("\u05d4\u05d8\u05d9\u05e4\u05d5\u05dc", session.Notes),
    labeledValue("\u05d4\u05e2\u05e8\u05d5\u05ea", session.SessionNotes),
    labeledValue("\u05ea\u05d6\u05db\u05d5\u05e8\u05ea", session.RemDescription),
    labeledValue("\u05d4\u05d5\u05e8\u05d0\u05d5\u05ea", session.Instructions),
    labeledValue("\u05e4\u05e8\u05d9\u05d8\u05d9\u05dd", itemsWithTotal),
    labeledValue("\u05d3\u05d5\u05e4\u05e7", session.Pulse),
    labeledValue("\u05e0\u05e9\u05d9\u05de\u05d4", session.Breath),
    session.Weight && session.Weight > 0
      ? labeledValue("\u05de\u05e9\u05e7\u05dc", String(session.Weight))
      : "",
    session.Temprature && session.Temprature > 0
      ? labeledValue("\u05d8\u05de\u05e4\u05e8\u05d8\u05d5\u05e8\u05d4", String(session.Temprature))
      : "",
  ].filter(Boolean).join("\n");
};

const formatObjectDetails = (value: Record<string, unknown>): string =>
  Object.entries(value)
    .filter(([key, item]) =>
      key !== "__type" && item !== null && item !== undefined &&
      item !== "" && item !== 0 && item !== false,
    )
    .map(([key, item]) =>
      `${key}: ${Array.isArray(item) ? item.join(", ") : String(item)}`,
    )
    .join("\n");

export const toClinicaVisitRow = (row: RegPetGeneral): string[] | null => {
  if (row.Session?.SessionID) {
    return [
      formatClinicaDateTime(row.Session.Date || row.Date),
      formatSessionDetails(row.Session, row.BranchName),
    ];
  }

  if (row.Vaccine) {
    return [
      formatClinicaDateTime(row.Date || row.Vaccine.Date),
      [
        [
          labeledValue("\u05d4\u05e8\u05d5\u05e4\u05d0", row.Vaccine.TherapistName),
          labeledValue("\u05e1\u05e0\u05d9\u05e3", row.BranchName),
        ].filter(Boolean).join("\n"),
        labeledValue("\u05e9\u05dd", row.Vaccine.Name),
        labeledValue("\u05d4\u05e2\u05e8\u05d5\u05ea", row.Vaccine.Notes),
        labeledValue("\u05d7\u05d9\u05e1\u05d5\u05df \u05d4\u05d1\u05d0", row.Vaccine.NextDate),
      ].filter(Boolean).join("\n"),
    ];
  }

  if (row.Docs) {
    const url = normalizeValue(row.Docs.FilePath) || normalizeValue(row.Docs.DocPath);
    return [
      formatClinicaDateTime(row.Date || row.Docs.DateCreated),
      [labeledValue("\u05de\u05e1\u05de\u05da", row.Docs.DocNotes), url]
        .filter(Boolean)
        .join("\n"),
    ];
  }

  const other = row.Pres ?? row.Labs ?? row.TestNames ?? row.Order;
  return other
    ? [formatClinicaDateTime(row.Date), formatObjectDetails(other)]
    : null;
};

const getPetSessions = async (page: Page, petId: string, petName: string) => {
  const numericPetId = Number(petId);
  if (!Number.isFinite(numericPetId) || numericPetId <= 0) {
    throw new Error("מזהה החיה בקליניקה אינו תקין");
  }
  const result = await callApi(
    page,
    `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.petSessions}`,
    {
      Anam: "",
      All: 1,
      fromDate: "",
      toDate: "",
      PetID: numericPetId,
      withWatch: 1,
    },
  );
  let parsed: { d?: RegPetGeneral[] };
  try {
    parsed = JSON.parse(result.text);
  } catch {
    logger.error("Clinica pet sessions response could not be parsed", {
      module: MODULE,
      event: "clinica_pet_sessions_parse_failed",
      operation: "load_pet_sessions",
      pet_id: petId,
      status: result.status,
      body_preview: result.text.slice(0, 300),
    });
    throw new Error("לא ניתן היה לקרוא את היסטוריית הביקורים מהקליניקה");
  }
  const sourceRows = Array.isArray(parsed.d) ? parsed.d : [];
  const rows = sourceRows
    .map(toClinicaVisitRow)
    .filter((row): row is string[] => row !== null);
  if (rows.length === 0) return [];
  const firstSession = sourceRows.find((row) => row.Session?.PetName)?.Session;
  return [{
    patientName: normalizeValue(petName) || normalizeValue(firstSession?.PetName),
    ownerName: "",
    ownerPhone: "",
    recordType: "visitDetails",
    rawText: rows.map((row) => row.filter(Boolean).join(" | ")).join("\n"),
    table: {
      headers: ["תאריך", "פרטים"],
      rows,
    },
    syncedAt: new Date(),
  }];
};

const petAge = (dateBirth?: string): { ageYears?: number; ageMonths?: number } => {
  if (!dateBirth) {
    return {};
  }

  const birth = new Date(dateBirth);

  if (Number.isNaN(birth.getTime()) || birth.getTime() <= 0) {
    return {};
  }

  const now = new Date();
  let totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (now.getDate() < birth.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths < 0) {
    return {};
  }

  return {
    ageYears: Math.floor(totalMonths / 12),
    ageMonths: totalMonths % 12,
  };
};

export const toClinicaPet = (pet: RegPet): ClinicaClientPet | null => {
  const name = normalizeValue(pet.Name);

  if (!name) {
    return null;
  }

  return {
    externalPatientId: String(pet.PetID ?? pet.recordID ?? pet.ID ?? "") || undefined,
    name,
    gender: pet.Sex === 1 ? "נקבה" : pet.Sex === 0 ? "זכר" : undefined,
    breed: normalizeValue(pet.Breed) || undefined,
    species: normalizeValue(pet.Type) || undefined,
    color: normalizeValue(pet.Color) || undefined,
    weightKg: pet.Weight && pet.Weight > 0 ? pet.Weight : undefined,
    insurance: normalizeValue(pet.InsuranceName) || undefined,
    microchipNumber: normalizeValue(pet.ElectNumber) || undefined,
    neutered: pet.Neut === 1 ? true : pet.Neut === 0 ? false : undefined,
    notes: normalizeValue(pet.JumpNote) || undefined,
    rawData: pet,
    ...petAge(pet.DateBirth),
  };
};

const getPetDetails = async (page: Page, pet: RegPet): Promise<RegPet> => {
  const petId = Number(pet.PetID ?? pet.recordID ?? pet.ID);
  if (!Number.isFinite(petId) || petId <= 0) return pet;

  const result = await callApi(
    page,
    `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.petDetails}`,
    { PetID: petId },
  );

  try {
    const parsed: { d?: RegPet | string | null } = JSON.parse(result.text);
    const details =
      typeof parsed.d === "string" ? JSON.parse(parsed.d) as RegPet : parsed.d;

    if (!details || typeof details !== "object") throw new Error("Invalid pet details");

    return { ...pet, ...details };
  } catch (error) {
    logger.warn("Clinica pet details could not be fetched", {
      module: MODULE,
      event: "clinica_pet_details_fetch_failed",
      operation: "load_pet_details",
      pet_id: String(petId),
      status: result.status,
      body_preview: result.text.slice(0, 300),
      error_message: error instanceof Error ? error.message : String(error),
    });
    return pet;
  }
};

const getClientPets = async (
  page: Page,
  petsEndpoint: string,
  userId: string,
): Promise<ClinicaClientPet[]> => {
  if (!userId) {
    return [];
  }

  const result = await callApi(page, petsEndpoint, { PatientID: userId });

  let parsed: { d?: RegPet[] } = {};

  try {
    parsed = JSON.parse(result.text);
  } catch (error) {
    logger.error("Clinica pet list response could not be parsed", {
      module: MODULE,
      event: "clinica_pet_list_parse_failed",
      operation: "get_pets_names",
      user_id: userId,
      status: result.status,
      body_preview: result.text.slice(0, 300),
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw new Error("לא ניתן היה לקרוא את רשימת החיות מהקליניקה");
  }

  const rows = Array.isArray(parsed.d) ? parsed.d : [];

  const pets: ClinicaClientPet[] = [];

  for (const row of rows) {
    const mappedPet = toClinicaPet(await getPetDetails(page, row));
    if (mappedPet) pets.push(mappedPet);
  }

  logger.info("Clinica client pets fetched", {
    module: MODULE,
    event: "clinica_client_pets_fetched",
    user_id: userId,
    pets_count: pets.length,
    pets: pets.map((pet) => ({
      pet_id: pet.externalPatientId,
      pet_name: pet.name,
      color: pet.color,
    })),
  });

  return pets;
};

const upsertApiClient = async (
  page: Page,
  petsEndpoint: string,
  row: RegPersonal,
): Promise<{
  outcome: "inserted" | "updated" | "unchanged" | "skipped";
  externalPatientId: string;
}> => {
  const externalPatientId = String(row.recordID ?? "");
  const ownerName = normalizeValue(
    [row.FirstName, row.LastName].filter(Boolean).join(" "),
  );
  const ownerPhone = normalizeValue(row.CellPhone) || normalizeValue(row.Phone);

  if (!externalPatientId || !ownerName) {
    return { outcome: "skipped", externalPatientId };
  }

  try {
    const existing = await ClinicaClientModel.findOne({ externalPatientId });
    const fetchedPets = await getClientPets(page, petsEndpoint, String(row.UserID));
    const existingPets = toPlainClinicaPets(existing?.pets ?? []);
    const mergedPets = mergePets(existingPets, fetchedPets);

    logger.info("Clinica client pets prepared for persistence", {
      module: MODULE,
      event: "clinica_client_pets_persisting",
      externalPatientId,
      pets_count: mergedPets.length,
      pets: mergedPets.map((pet) => ({
        pet_id: pet.externalPatientId,
        pet_name: pet.name,
        color: pet.color,
      })),
    });
    const rawData = {
      ...row,
      Email: normalizeValue(row.Email) || undefined,
      Address: normalizeValue(row.Address) || undefined,
    };

    if (existing) {
      await ClinicaClientModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            ownerName,
            ownerPhone,
            pets: mergedPets,
            rawData,
            lastSyncedAt: new Date(),
          },
        },
      );

      return { outcome: "updated", externalPatientId };
    }

    await ClinicaClientModel.create({
      externalPatientId,
      ownerName,
      ownerPhone,
      pets: mergedPets,
      rawData,
      lastSyncedAt: new Date(),
    });

    return { outcome: "inserted", externalPatientId };
  } catch (error) {
    logger.error("Clinica API pull: failed to upsert client", {
      module: MODULE,
      event: "clinica_api_pull_upsert_failed",
      externalPatientId,
      error_message: error instanceof Error ? error.message : String(error),
    });

    return { outcome: "skipped", externalPatientId };
  }
};

const fetchClientRows = async (
  page: Page,
  endpoint: string,
  body: unknown,
): Promise<RegPersonal[] | null> => {
  const apiResult = await callApi(page, endpoint, body);

  try {
    const parsed: { d?: RegPersonal[] } = JSON.parse(apiResult.text);

    return Array.isArray(parsed.d) ? parsed.d : [];
  } catch {
    logger.error("Clinica API: failed to parse response", {
      module: MODULE,
      event: "clinica_api_parse_failed",
      status: apiResult.status,
      bodyPreview: apiResult.text.slice(0, 300),
    });

    return null;
  }
};

const applySyncOutcome = (
  result: { inserted: number; updated: number; unchanged: number; skipped: number },
  outcome: "inserted" | "updated" | "unchanged" | "skipped",
): void => {
  if (outcome === "inserted") result.inserted += 1;
  else if (outcome === "updated") result.updated += 1;
  else if (outcome === "unchanged") result.unchanged += 1;
  else result.skipped += 1;
};

const openClientsListPage = async (page: Page): Promise<void> => {
  await clinicaScraperService.login(page, {
    username: ENV.clinicUsername,
    password: ENV.clinicPassword,
  });
  await clinicaScraperService.selectClinicCenterIfNeeded(page);
  await page.goto(
    `${ENV.clinicaBaseUrl}/vetclinic/therapists/patientlistvet.aspx`,
    { waitUntil: "networkidle", timeout: 60000 },
  );
  await page.waitForTimeout(1200);
};

export const selectLatestClinicaClients = (
  rows: RegPersonal[],
  limit = CLINICA_LATEST_CLIENT_LIMIT,
): RegPersonal[] => {
  const selected: RegPersonal[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const recordId = String(row.recordID ?? "").trim();
    const userId = String(row.UserID ?? "").trim();
    const identity = userId || recordId;

    if (row.recordID <= 0 || !userId || userId === "0" || seen.has(identity)) continue;

    seen.add(identity);
    selected.push(row);

    if (selected.length === limit) break;
  }

  return selected;
};

export const runClinicaPetSessionsFetch = async (
  petId: string,
  petName: string,
) => {
  await clinicaScraperService.init();
  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(CLINICA_PAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(CLINICA_NAVIGATION_TIMEOUT_MS);
  try {
    await openClientsListPage(page);
    return await getPetSessions(page, petId, petName);
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};

export type ClinicaSyncResult = {
  pagesFetched: number;
  rowsSeen: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
};

const emptySyncResult = (): ClinicaSyncResult => ({
  pagesFetched: 0,
  rowsSeen: 0,
  inserted: 0,
  updated: 0,
  unchanged: 0,
  skipped: 0,
});

export const syncLatestClinicaClientRows = async (
  rows: RegPersonal[],
  syncClient: (row: RegPersonal) => Promise<
    "inserted" | "updated" | "unchanged" | "skipped"
  >,
): Promise<ClinicaSyncResult> => {
  const latestClients = selectLatestClinicaClients(rows);
  const result = emptySyncResult();
  result.pagesFetched = 1;
  result.rowsSeen = latestClients.length;

  for (const row of latestClients) {
    try {
      applySyncOutcome(result, await syncClient(row));
    } catch (error) {
      result.skipped += 1;
      logger.error("Clinica latest sync: client failed", {
        module: MODULE,
        event: "clinica_latest_sync_client_failed",
        externalPatientId: String(row.recordID),
        userId: String(row.UserID),
        error_message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
};

const upsertRowsAboveBoundary = async (
  page: Page,
  endpoint: string,
  petsEndpoint: string,
  ourMaxId: number,
  firstPage: RegPersonal[],
  result: ClinicaSyncResult,
): Promise<void> => {
  let rows = firstPage;

  while (rows.length > 0) {
    result.pagesFetched += 1;
    result.rowsSeen += rows.length;

    for (const row of rows) {
      if (row.recordID <= ourMaxId) {
        return;
      }

      const { outcome } = await upsertApiClient(page, petsEndpoint, row);
      applySyncOutcome(result, outcome);
    }

    const startFrom = rows[rows.length - 1].recordID;
    const nextRows = await fetchClientRows(page, endpoint, { startFrom });

    if (nextRows === null) {
      logger.error("Clinica diff sync: page fetch failed, stopping early", {
        module: MODULE,
        event: "clinica_diff_sync_page_fetch_failed",
        ourMaxId,
      });
      return;
    }

    rows = nextRows;
  }
};

export const runClinicaDiffSync = async (): Promise<ClinicaSyncResult> => {
  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(CLINICA_PAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(CLINICA_NAVIGATION_TIMEOUT_MS);

  const result = emptySyncResult();

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.newPatients}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.pets}`;

    const rows = await fetchClientRows(page, endpoint, { startFrom: 0 });

    if (rows === null) {
      logger.error("Clinica diff sync: initial fetch failed, stopping", {
        module: MODULE,
        event: "clinica_diff_sync_initial_fetch_failed",
      });
      return result;
    }

    if (rows.length === 0) {
      logger.info("Clinica diff sync: no clients returned, nothing to do", {
        module: MODULE,
        event: "clinica_diff_sync_empty",
      });
      return result;
    }

    const clinicaMaxId = rows[0].recordID ?? 0;
    const [ourMaxRow] = await ClinicaClientModel.aggregate<{ numericId: number }>([
      {
        $addFields: {
          numericId: {
            $convert: { input: "$externalPatientId", to: "int", onError: 0, onNull: 0 },
          },
        },
      },
      { $sort: { numericId: -1 } },
      { $limit: 1 },
      { $project: { numericId: 1 } },
    ]);
    const ourMaxId = ourMaxRow?.numericId ?? 0;

    logger.info("Clinica diff sync: computed boundary", {
      module: MODULE,
      event: "clinica_diff_sync_boundary",
      clinicaMaxId,
      ourMaxId,
    });

    if (clinicaMaxId <= ourMaxId) {
      return result;
    }

    await upsertRowsAboveBoundary(page, endpoint, petsEndpoint, ourMaxId, rows, result);

    logger.info("Clinica diff sync finished", {
      module: MODULE,
      event: "clinica_diff_sync_finished",
      clinicaMaxId,
      ourMaxId,
      ...result,
    });

    return result;
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};

export const runClinicaLatestSync = async (): Promise<ClinicaSyncResult> => {
  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(CLINICA_PAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(CLINICA_NAVIGATION_TIMEOUT_MS);

  const result = emptySyncResult();

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.lastPatients}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.pets}`;

    const rows = await fetchClientRows(page, endpoint, LAST_PATIENTS_PAYLOAD);

    if (rows === null) {
      logger.error("Clinica latest sync: fetch failed", {
        module: MODULE,
        event: "clinica_latest_sync_fetch_failed",
        operation: "get_last_patients",
      endpoint: CLINICA_API_PATHS.lastPatients,
      });
      throw new Error("לא ניתן היה לקבל את 20 הלקוחות האחרונים מהקליניקה");
    }

    Object.assign(
      result,
      await syncLatestClinicaClientRows(rows, async (row) =>
        (await upsertApiClient(page, petsEndpoint, row)).outcome,
      ),
    );

    logger.info("Clinica latest sync finished", {
      module: MODULE,
      event: "clinica_latest_sync_finished",
      ...result,
    });

    return result;
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};

export type SingleClientSyncResult = {
  found: boolean;
  outcome?: "inserted" | "updated" | "unchanged" | "skipped";
};

export const runClinicaSingleClientSync = async (
  externalPatientId: string,
): Promise<SingleClientSyncResult> => {
  const targetId = Number(externalPatientId);

  if (!Number.isFinite(targetId)) {
    return { found: false };
  }

  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(CLINICA_PAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(CLINICA_NAVIGATION_TIMEOUT_MS);

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.newPatients}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${CLINICA_API_PATHS.pets}`;

    const rows = await fetchClientRows(page, endpoint, { startFrom: targetId + 1 });

    if (rows === null) {
      logger.error("Clinica single client sync: fetch failed", {
        module: MODULE,
        event: "clinica_single_sync_fetch_failed",
        externalPatientId,
      });
      return { found: false };
    }

    const row = rows.find((candidate) => Number(candidate.recordID) === targetId);

    if (!row) {
      logger.warn("Clinica single client sync: client not found", {
        module: MODULE,
        event: "clinica_single_sync_not_found",
        externalPatientId,
      });
      return { found: false };
    }

    const { outcome } = await upsertApiClient(page, petsEndpoint, row);

    logger.info("Clinica single client sync finished", {
      module: MODULE,
      event: "clinica_single_sync_finished",
      externalPatientId,
      outcome,
    });

    return { found: true, outcome };
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};
