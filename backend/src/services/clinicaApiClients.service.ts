import type { Page } from "playwright";
import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import { clinicaScraperService } from "./clinicaScraper.service.js";
import { ClinicaClientModel } from "../models/clinicaClient/index.js";
import type { ClinicaClientPet } from "../models/clinicaClient/index.js";
import { mergePets } from "../utils/clinicaPetMerge.utils.js";

const MODULE = "clinica-api";
const NEW_PATIENTS_ENDPOINT_PATH = "/Restricted/dbCalander.asmx/GetNewPatientsVisited";
const LAST_PATIENTS_ENDPOINT_PATH = "/Restricted/dbCalander.asmx/GetLastPatients";
const PETS_ENDPOINT_PATH = "/Restricted/dbCalander.asmx/GetPetsNames";

type RegPersonal = {
  recordID: number;
  UserID: string;
  FirstName: string;
  LastName: string;
  CellPhone: string;
  Phone: string;
  Address: string;
  Email: string;
  NumCust?: number;
};

type RegPet = {
  Name: string;
  Type?: string;
  Breed?: string;
  Sex?: number;
  Weight?: number;
  DateBirth?: string;
  NotActive?: number;
};

const normalizeValue = (value?: string | null): string =>
  value?.trim().replace(/\s+/g, " ") ?? "";

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

const toClinicaPet = (pet: RegPet): ClinicaClientPet | null => {
  const name = normalizeValue(pet.Name);

  if (!name) {
    return null;
  }

  return {
    name,
    gender: pet.Sex === 1 ? "נקבה" : pet.Sex === 0 ? "זכר" : undefined,
    breed: normalizeValue(pet.Breed) || undefined,
    species: normalizeValue(pet.Type) || undefined,
    weightKg: pet.Weight && pet.Weight > 0 ? pet.Weight : undefined,
    ...petAge(pet.DateBirth),
  };
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
  } catch {
    return [];
  }

  const rows = Array.isArray(parsed.d) ? parsed.d : [];

  return rows.map(toClinicaPet).filter((pet): pet is ClinicaClientPet => pet !== null);
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

  if (!externalPatientId || !ownerName || !ownerPhone) {
    return { outcome: "skipped", externalPatientId };
  }

  try {
    const existing = await ClinicaClientModel.findOne({ externalPatientId });
    const fetchedPets = await getClientPets(page, petsEndpoint, row.UserID);
    const mergedPets = mergePets(existing?.pets ?? [], fetchedPets);
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

// Walks GetNewPatientsVisited page by page (newest recordID first), upserting
// rows until it reaches one at or below ourMaxId - everything past that point
// we already have.
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

// Cron target. Compares Clinica's highest recordID against the highest
// externalPatientId we have stored, then walks GetNewPatientsVisited (newest
// recordID first) upserting only rows above that boundary - enough to cover
// everyone new since the last run, without walking the whole client base
// every night, and without drifting from count-based skips/deletions.
export const runClinicaDiffSync = async (): Promise<ClinicaSyncResult> => {
  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  const result = emptySyncResult();

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${NEW_PATIENTS_ENDPOINT_PATH}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${PETS_ENDPOINT_PATH}`;

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

// Manual "sync now" button. GetLastPatients returns clients ordered by
// LastVisit descending - the actual "last active" list. GetPatientsDetailsClinicVet's
// default view looked similar but every row had an empty LastVisit, so it
// wasn't recency-based at all.
export const runClinicaLatestSync = async (): Promise<ClinicaSyncResult> => {
  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  const result = emptySyncResult();

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${LAST_PATIENTS_ENDPOINT_PATH}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${PETS_ENDPOINT_PATH}`;

    const rows = await fetchClientRows(page, endpoint, { move: 0, fromDate: "" });

    if (rows === null) {
      logger.error("Clinica latest sync: fetch failed", {
        module: MODULE,
        event: "clinica_latest_sync_fetch_failed",
      });
      return result;
    }

    result.pagesFetched = 1;
    result.rowsSeen = rows.length;

    for (const row of rows) {
      const { outcome } = await upsertApiClient(page, petsEndpoint, row);
      applySyncOutcome(result, outcome);
    }

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

// Per-row "update client" button. GetNewPatientsVisited returns clients with
// recordID strictly below startFrom, so startFrom = id + 1 puts this exact
// client first in the response.
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
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await openClientsListPage(page);

    const endpoint = `${ENV.clinicaBaseUrl}${NEW_PATIENTS_ENDPOINT_PATH}`;
    const petsEndpoint = `${ENV.clinicaBaseUrl}${PETS_ENDPOINT_PATH}`;

    const rows = await fetchClientRows(page, endpoint, { startFrom: targetId + 1 });

    if (rows === null) {
      logger.error("Clinica single client sync: fetch failed", {
        module: MODULE,
        event: "clinica_single_sync_fetch_failed",
        externalPatientId,
      });
      return { found: false };
    }

    const row = rows.find((candidate) => candidate.recordID === targetId);

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
