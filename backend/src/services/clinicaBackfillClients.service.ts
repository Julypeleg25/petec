import fs from "fs/promises";
import path from "path";
import type { Page } from "playwright";
import { ENV } from "../config/config.js";
import {
  ClinicaBackfillClientModel,
  type IClinicaBackfillClient,
} from "../models/clinicaBackfillClient/index.js";
import type { ClinicaClientPet } from "../models/clinicaClient/index.js";
import { clinicaScraperService } from "./clinicaScraper.service.js";
import type { ClinicaMedicalRecordDto } from "../utils/clinica-query.types.js";

type BackfillOptions = {
  dryRun: boolean;
  resume: boolean;
  resetNew: boolean;
  clearNewOnly: boolean;
  allClients: boolean;
  plusOnly: boolean;
  detailsOnly: boolean;
  limit?: number;
  fromPage: number;
  delayMs: number;
  batchSize: number;
  deadline?: Date;
};

type BackfillMode = "all-clients" | "latest";

type Checkpoint = {
  mode?: BackfillMode;
  lastCompletedPage: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  batchesCompleted: number;
};

type ExtractedClientRow = Awaited<
  ReturnType<typeof clinicaScraperService.extractClientRows>
>[number];

type PetDetails = Partial<
  Pick<
    ClinicaClientPet,
    | "gender"
    | "breed"
    | "species"
    | "color"
    | "weightKg"
    | "ageYears"
    | "ageMonths"
    | "insurance"
    | "treatingDoctor"
    | "referringDoctor"
  >
>;

type ParsedPetSummary = {
  name: string;
  details: PetDetails;
};

type DetailDomField = {
  label: string;
  value: string;
  id: string;
  name: string;
  type: string;
};

type BasicPetExtraction = {
  name: string;
  details: PetDetails;
};

const CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  ".clinica-backfill-clients-checkpoint.json",
);

const FAILURES_PATH = path.resolve(
  process.cwd(),
  "clinica-backfill-clients-failures.jsonl",
);

const DEBUG_LOG_PATH = path.resolve(
  process.cwd(),
  "clinica-backfill-debug.log",
);

const logDebug = (message: string): void => {
  console.warn(message);
  fs.appendFile(DEBUG_LOG_PATH, `${new Date().toISOString()} ${message}\n`).catch(
    () => undefined,
  );
};

const CLIENTS_PAGE_URL = `${ENV.clinicaBaseUrl}/vetclinic/therapists/patientlistvet.aspx`;

const EMPTY_CHECKPOINT: Checkpoint = {
  lastCompletedPage: 0,
  processed: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  batchesCompleted: 0,
};

const getBackfillMode = (options: Pick<BackfillOptions, "allClients">): BackfillMode =>
  options.allClients ? "all-clients" : "latest";

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isDeadlineReached = (deadline?: Date): boolean =>
  deadline !== undefined && Date.now() >= deadline.getTime();

const normalizeValue = (value?: string): string =>
  value?.trim().replace(/\s+/g, " ") ?? "";

const toNumberValue = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value.replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toIntegerValue = (value?: string): number | undefined => {
  const numberValue = toNumberValue(value);

  return numberValue !== undefined &&
    Number.isInteger(numberValue) &&
    numberValue >= 0
    ? numberValue
    : undefined;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const readCheckpoint = async (): Promise<Checkpoint> => {
  try {
    const raw = await fs.readFile(CHECKPOINT_PATH, "utf8");

    return {
      ...EMPTY_CHECKPOINT,
      ...(JSON.parse(raw) as Partial<Checkpoint>),
    };
  } catch {
    return { ...EMPTY_CHECKPOINT };
  }
};

const writeCheckpoint = async (checkpoint: Checkpoint): Promise<void> => {
  await fs.writeFile(CHECKPOINT_PATH, `${JSON.stringify(checkpoint, null, 2)}\n`);
};

const resetCheckpoint = async (): Promise<void> => {
  await writeCheckpoint({ ...EMPTY_CHECKPOINT });
};

const resetFailures = async (): Promise<void> => {
  await fs.unlink(FAILURES_PATH).catch(() => undefined);
};

const logFailure = async (data: unknown): Promise<void> => {
  await fs.appendFile(FAILURES_PATH, `${JSON.stringify(data)}\n`);
};

const waitForClientsRows = async (page: Page): Promise<void> => {
  const clientsTable =
    (await page.locator("#pats").count()) > 0
      ? page.locator("#pats").first()
      : page.locator("table").filter({ hasText: "שם הלקוח" }).first();

  await clientsTable.waitFor({
    state: "visible",
    timeout: 20000,
  });

  await clientsTable
    .locator("tr")
    .nth(1)
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => undefined);
};

const openClientsPageForBackfill = async (page: Page): Promise<void> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(CLIENTS_PAGE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
      await wait(1500);
      await waitForClientsRows(page);

      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Clinica Backfill] opening clients page failed, retry ${attempt}/3: ${getErrorMessage(error)}`,
      );
      await wait(1500 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Could not open Clinica clients page: ${String(lastError)}`);
};

const getClientsTable = (page: Page) => {
  const patsTable = page.locator("#pats").first();
  const fallbackTable = page.locator("table").filter({ hasText: "שם הלקוח" }).first();

  return patsTable.or(fallbackTable).first();
};

const getClientsRowsSignature = async (page: Page): Promise<string> =>
  getClientsTable(page)
    .innerText({ timeout: 5000 })
    .then((text) => text.replace(/\s+/g, " ").trim())
    .catch(() => "");

const getVisibleClientIdsSignature = async (page: Page): Promise<string> => {
  const table =
    (await page.locator("#pats").count()) > 0
      ? page.locator("#pats").first()
      : getClientsTable(page);
  const rows = table.locator("tr");
  const rowCount = await rows.count();
  const ids: string[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const cells = rows.nth(index).locator("td");

    if ((await cells.count()) < 2) {
      continue;
    }

    const firstCellText = normalizeValue(
      (await cells.first().textContent().catch(() => "")) ?? "",
    );
    const id = firstCellText.match(/\d{1,}/)?.[0];

    if (id) {
      ids.push(id);
    }
  }

  return ids.join("|");
};

const selectAllClientsIncludingInactive = async (page: Page): Promise<void> => {
  const select = page.locator("#SelectFilter").first();

  if ((await select.count()) > 0) {
    const option = select
      .locator("option")
      .filter({ hasText: "כל הלקוחות" })
      .filter({ hasText: "לא פעילים" })
      .first();
    const value = await option.getAttribute("value").catch(() => null);

    if (value !== null) {
      await select.selectOption(value);
    }
  } else {
    const selects = page.locator("select");
    const count = await selects.count();
    let selected = false;

    for (let index = 0; index < count; index += 1) {
      const currentSelect = selects.nth(index);
      const options = currentSelect.locator("option");
      const optionCount = await options.count();

      for (let optionIndex = 0; optionIndex < optionCount; optionIndex += 1) {
        const currentOption = options.nth(optionIndex);
        const text = normalizeValue(await currentOption.innerText().catch(() => ""));

        if (!text.includes("כל הלקוחות") || !text.includes("לא פעילים")) {
          continue;
        }

        const value = await currentOption.getAttribute("value");

        if (value !== null) {
          await currentSelect.selectOption(value);
          selected = true;
          break;
        }
      }

      if (selected) {
        break;
      }
    }

    if (!selected) {
      throw new Error("Could not select all clients including inactive");
    }
  }

  const refreshButton = page.locator("#button2").first();

  if ((await refreshButton.count()) > 0) {
    await refreshButton.click({ timeout: 10000 });
  } else {
    await page
      .locator('input[type="button"][value="רענן"], button:has-text("רענן")')
      .first()
      .click({ timeout: 10000 });
  }

  await page.waitForLoadState("networkidle").catch(() => undefined);
  await wait(1200);
  await waitForClientsRows(page);
};

const selectLatestVisitedClients = async (page: Page): Promise<void> => {
  const select = page.locator("#SelectFilter").first();

  if ((await select.count()) > 0) {
    const option = select
      .locator("option")
      .filter({ hasText: "20" })
      .filter({ hasText: "אחרונים" })
      .first();
    const value = await option.getAttribute("value").catch(() => null);

    if (value !== null) {
      await select.selectOption(value);
    }
  }

  const refreshButton = page.locator("#button2").first();

  if ((await refreshButton.count()) > 0) {
    await refreshButton.click({ timeout: 10000 });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await wait(1200);
  }

  await waitForClientsRows(page);
};

const openStartClientsPage = async (
  page: Page,
  allClients: boolean,
): Promise<void> => {
  await openClientsPageForBackfill(page);

  if (allClients) {
    await selectAllClientsIncludingInactive(page);
  } else {
    await selectLatestVisitedClients(page);
  }
};

const hasPlusPetSplit = (row: ExtractedClientRow): boolean =>
  row.petNames.length > 1 ||
  (row.petNames.length === 1 && row.petNames[0] !== row.ownerName);

const isValidExtractedPetName = (
  value: string,
  row: ExtractedClientRow,
): boolean => {
  const cleanValue = normalizeValue(value);

  if (!cleanValue || cleanValue === normalizeValue(row.ownerName)) {
    return false;
  }

  if (cleanValue.length > 40 || /^\d+$/.test(cleanValue)) {
    return false;
  }

  const ignoredWords = [
    "בחר",
    "סינון",
    "פרטי",
    "לקוח",
    "לקוחות",
    "תיק",
    "רופא",
    "ביקור",
    "חיסונים",
    "מסמכים",
    "מדדים",
    "מעבדה",
    "כספים",
    "תורים",
  ];

  return (
    /[\u0590-\u05FF]/.test(cleanValue) &&
    !ignoredWords.some((word) => cleanValue.includes(word))
  );
};

const extractPetNamesFromDetailPage = async (
  page: Page,
  row: ExtractedClientRow,
): Promise<string[]> => {
  const names: string[] = [];
  const petNameFields = [
    page.locator("#TextBoxPetName").first(),
    page.locator('input[id*="PetName" i]').first(),
  ];

  for (const field of petNameFields) {
    if ((await field.count()) === 0) {
      continue;
    }

    const value = normalizeValue(await field.inputValue().catch(() => ""));

    if (value) {
      names.push(value);
    }
  }

  const summaryValue = normalizeValue(
    await page.locator("#TextBoxName").first().inputValue().catch(() => ""),
  );
  const parsedSummary = parsePetSummaryText(summaryValue);

  if (parsedSummary) {
    names.push(parsedSummary.name);
  }

  return Array.from(new Set(names.map(normalizeValue))).filter((name) =>
    isValidExtractedPetName(name, row),
  );
};

const extractDetailDomFields = async (page: Page): Promise<DetailDomField[]> =>
  page
    .evaluate<DetailDomField[]>(() => {
      const clean = (value: string | null | undefined): string =>
        (value ?? "").replace(/\s+/g, " ").trim();

      const getElementValue = (element: Element): string => {
        if (element instanceof HTMLSelectElement) {
          return clean(element.selectedOptions[0]?.textContent || element.value);
        }

        if (element instanceof HTMLInputElement) {
          if (element.type === "radio" || element.type === "checkbox") {
            return element.checked ? clean(element.value || "checked") : "";
          }

          return clean(element.value);
        }

        if (element instanceof HTMLTextAreaElement) {
          return clean(element.value);
        }

        return clean(element.textContent);
      };

      const getNearLabel = (element: Element): string => {
        const id = element.getAttribute("id");
        const ariaLabel = element.getAttribute("aria-label");
        const name = element.getAttribute("name");

        if (id) {
          const explicitLabel = document.querySelector(`label[for="${id}"]`);
          const explicitText = clean(explicitLabel?.textContent);

          if (explicitText) {
            return explicitText;
          }
        }

        const parentLabelText = clean(element.closest("label")?.textContent);

        if (parentLabelText) {
          return parentLabelText;
        }

        const cell = element.closest("td");
        const siblings = [
          cell?.previousElementSibling,
          cell?.nextElementSibling,
          element.previousElementSibling,
          element.nextElementSibling,
        ];

        for (const sibling of siblings) {
          const text = clean(sibling?.textContent);

          if (text) {
            return text;
          }
        }

        return clean([ariaLabel, id, name].filter(Boolean).join(" "));
      };

      return Array.from(document.querySelectorAll("input, select, textarea"))
        .map((element) => ({
          label: getNearLabel(element),
          value: getElementValue(element),
          id: clean(element.getAttribute("id")),
          name: clean(element.getAttribute("name")),
          type:
            element instanceof HTMLInputElement
              ? clean(element.type)
              : element.tagName.toLowerCase(),
        }))
        .filter((field) => field.value);
    })
    .catch(() => []);

const isPetNameField = (field: DetailDomField): boolean => {
  const label = normalizeValue(field.label);
  const id = field.id.toLowerCase();
  const name = field.name.toLowerCase();

  return (
    label.includes("שם החיה") ||
    label.includes("שם מטופל") ||
    id.includes("petname") ||
    name.includes("petname")
  );
};

const extractBasicPetFromDetailPage = async (
  page: Page,
  row: ExtractedClientRow,
): Promise<BasicPetExtraction | null> => {
  const summaryValue = normalizeValue(
    await page.locator("#TextBoxName").first().inputValue().catch(() => ""),
  );
  const parsedSummary = parsePetSummaryText(summaryValue);

  if (parsedSummary && isValidExtractedPetName(parsedSummary.name, row)) {
    return {
      name: parsedSummary.name,
      details: mergeDetails(parsedSummary.details, await extractRobustPetDetails(page)),
    };
  }

  const fields = await extractDetailDomFields(page);
  const petName = fields
    .filter(isPetNameField)
    .map((field) => normalizeValue(field.value))
    .find((value) => isValidExtractedPetName(value, row));

  if (!petName) {
    return null;
  }

  return {
    name: petName,
    details: await extractRobustPetDetails(page),
  };
};

const resolvePetNamesForOpenedDetail = async (
  page: Page,
  row: ExtractedClientRow,
  summaryDetailsByPetName: Map<string, PetDetails>,
): Promise<string[]> => {
  const listPetNames = Array.from(
    new Set(row.petNames.map(normalizeValue).filter(Boolean)),
  ).filter((name) => isValidExtractedPetName(name, row));

  if (hasPlusPetSplit(row) && listPetNames.length > 0) {
    return listPetNames;
  }

  const summaryPetNames = Array.from(summaryDetailsByPetName.keys()).filter(
    (name) => isValidExtractedPetName(name, row),
  );

  if (summaryPetNames.length > 0) {
    return summaryPetNames;
  }

  return extractPetNamesFromDetailPage(page, row);
};

const extractBackfillClientRows = async (
  page: Page,
): Promise<ExtractedClientRow[]> => {
  const backfillRows: ExtractedClientRow[] = [];
  const table =
    (await page.locator("#pats").count()) > 0
      ? page.locator("#pats").first()
      : getClientsTable(page);
  const tableRows = table.locator("tr");
  const rowCount = await tableRows.count();
  const extractPhone = (values: string[]): string =>
    values
      .map((value) => value.match(/0\d[\d-]{7,11}/)?.[0])
      .find(Boolean)
      ?.replace(/\D/g, "") ?? "";

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = tableRows.nth(rowIndex);
    const cells = row.locator("td");
    const cellCount = await cells.count();

    if (cellCount < 5) {
      continue;
    }

    const values: string[] = [];

    for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
      values.push(
        normalizeValue(
          (await cells.nth(cellIndex).textContent().catch(() => "")) ?? "",
        ),
      );
    }

    if (values.some((value) => value.includes("שם הלקוח"))) {
      continue;
    }

    const externalPatientId =
      values[0]?.match(/\d{1,}/)?.[0] ??
      values.find((value) => /^\d{2,}$/.test(value));
    const clientNameWithPets = normalizeValue(values[1]);
    const ownerPhone = extractPhone([
      values[4] ?? "",
      values[3] ?? "",
      ...values,
    ]);

    if (!externalPatientId || !clientNameWithPets || !ownerPhone) {
      continue;
    }

    const parts = clientNameWithPets
      .split("+")
      .map(normalizeValue)
      .filter(Boolean);
    const ownerName = parts[0] || clientNameWithPets;
    const petNames = parts.length > 1 ? parts.slice(1) : [];

    backfillRows.push({
      ownerName,
      ownerPhone,
      petNames,
      externalPatientId,
    });
  }

  const scraperRows = await clinicaScraperService
    .extractClientRows(page)
    .then((rows) => rows.filter(hasPlusPetSplit))
    .catch(() => []);
  const rows = [...backfillRows, ...scraperRows];
  const seen = new Set<string>();
  const byKey = new Map<string, ExtractedClientRow>();

  for (const row of rows as ExtractedClientRow[]) {
    const key = row.externalPatientId || `${row.ownerName}-${row.ownerPhone}`;
    const existing = byKey.get(key);
    const rowHasPlus = hasPlusPetSplit(row);
    const existingHasPlus = existing ? hasPlusPetSplit(existing) : false;

    if (
      !existing ||
      (rowHasPlus &&
        (!existingHasPlus || row.petNames.length > existing.petNames.length))
    ) {
      byKey.set(key, row);
    }
  }

  return Array.from(byKey.values()).filter((row) => {
    const key = row.externalPatientId || `${row.ownerName}-${row.ownerPhone}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return Boolean(row.ownerName && row.ownerPhone);
  }) as ExtractedClientRow[];
};

const getClientTableRows = (page: Page) =>
  ((page.locator("#pats tr").or(getClientsTable(page).locator("tr"))) as ReturnType<
    ReturnType<typeof getClientsTable>["locator"]
  >);

const isClientDetailPage = async (page: Page): Promise<boolean> => {
  if (page.url().toLowerCase().includes("registerp3vet")) {
    return true;
  }

  const bodyText = normalizeValue(
    await page.locator("body").innerText({ timeout: 2000 }).catch(() => ""),
  );

  return bodyText.includes("תיק לקוח") && bodyText.includes("שם החיה");
};

const dismissBlockingAlertIfPresent = async (page: Page): Promise<void> => {
  const alertButton = page.locator("#alertButton").first();

  if ((await alertButton.count()) === 0) {
    return;
  }

  const isVisible = await alertButton.isVisible().catch(() => false);

  if (!isVisible) {
    return;
  }

  console.log("[Clinica Backfill] dismissing blocking alert popup");
  await alertButton.click({ timeout: 5000 }).catch(() => undefined);
  await wait(500);
};

const waitForClientDetailPage = async (page: Page): Promise<boolean> => {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await wait(1500);
  await dismissBlockingAlertIfPresent(page);

  return isClientDetailPage(page);
};

const openClientDetailFromCurrentPage = async (
  page: Page,
  row: ExtractedClientRow,
): Promise<boolean> => {
  const rows = getClientTableRows(page);
  const rowsCount = await rows.count();
  const ownerName = normalizeValue(row.ownerName);
  const externalPatientId = normalizeValue(row.externalPatientId);
  const logAttempt = (strategy: string): void => {
    logDebug(
      `[Clinica Backfill] detail-open attempt: id=${externalPatientId} owner="${ownerName}" strategy=${strategy} url-after=${page.url()}`,
    );
  };
  let matchedRow = false;

  for (let index = 0; index < rowsCount; index += 1) {
    const tableRow = rows.nth(index);
    const rowText = normalizeValue(
      (await tableRow.textContent().catch(() => "")) ?? "",
    );

    if (
      !rowText ||
      (externalPatientId
        ? !rowText.includes(externalPatientId)
        : !rowText.includes(ownerName))
    ) {
      continue;
    }

    matchedRow = true;

    if (externalPatientId) {
      const idLabel = tableRow
        .locator("span.listLable", { hasText: externalPatientId })
        .first();

      if ((await idLabel.count()) > 0) {
        await Promise.all([
          page.waitForLoadState("networkidle").catch(() => undefined),
          idLabel.click({ timeout: 5000 }),
        ]);

        if (await waitForClientDetailPage(page)) {
          return true;
        }

        logAttempt("id-label");
      } else {
        logDebug(
          `[Clinica Backfill] detail-open: no span.listLable matched id=${externalPatientId}`,
        );
      }
    }

    const ownerLabel = tableRow
      .locator("span.listLable", {
        hasText: ownerName,
      })
      .first();

    if ((await ownerLabel.count()) > 0) {
      await Promise.all([
        page.waitForLoadState("networkidle").catch(() => undefined),
        ownerLabel.click({ timeout: 5000 }),
      ]);

      if (await waitForClientDetailPage(page)) {
        return true;
      }

      logAttempt("owner-label");
    } else {
      logDebug(
        `[Clinica Backfill] detail-open: no span.listLable matched owner="${ownerName}"`,
      );
    }

    const cells = tableRow.locator("td");
    const cellsCount = await cells.count();
    let matchedCell = false;

    for (let cellIndex = 0; cellIndex < cellsCount; cellIndex += 1) {
      const cell = cells.nth(cellIndex);
      const cellText = normalizeValue(await cell.innerText().catch(() => ""));

      if (!cellText.includes(ownerName)) {
        continue;
      }

      matchedCell = true;

      await Promise.all([
        page.waitForLoadState("networkidle").catch(() => undefined),
        cell.click({ force: true, timeout: 5000 }),
      ]);

      if (await waitForClientDetailPage(page)) {
        return true;
      }

      logAttempt(`cell[${cellIndex}]`);
    }

    if (!matchedCell) {
      logDebug(
        `[Clinica Backfill] detail-open: no td cell contained owner="${ownerName}"`,
      );
    }

    await Promise.all([
      page.waitForLoadState("networkidle").catch(() => undefined),
      tableRow.click({ force: true, timeout: 5000 }),
    ]);

    if (await waitForClientDetailPage(page)) {
      return true;
    }

    logAttempt("row-click");
  }

  if (!matchedRow) {
    logDebug(
      `[Clinica Backfill] detail-open: no row on this page matched id=${externalPatientId} owner="${ownerName}" (rowsCount=${rowsCount})`,
    );
  }

  return false;
};

const clickPetTab = async (page: Page, petName: string): Promise<void> => {
  const clickedTopPetTile = await page
    .evaluate((name) => {
      const clean = (value: string | null | undefined): string =>
        (value ?? "").replace(/\s+/g, " ").trim();

      const isVisible = (element: Element): boolean => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      };

      const candidates = Array.from(
        document.querySelectorAll("table, td, span, div, a"),
      )
        .filter((element) => isVisible(element))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const text = clean(element.textContent);

          return (
            text === name &&
            rect.top >= 0 &&
            rect.top < 330 &&
            rect.width <= 220 &&
            rect.height <= 170
          );
        })
        .sort(
          (left, right) =>
            left.getBoundingClientRect().top -
              right.getBoundingClientRect().top ||
            left.getBoundingClientRect().left -
              right.getBoundingClientRect().left,
        );

      const element = candidates[0];

      if (!element) {
        return false;
      }

      element.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      element.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );

      return true;
    }, petName)
    .catch(() => false);

  if (clickedTopPetTile) {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await wait(900);
    return;
  }

  const selectedFromPetDropdown = await page
    .evaluate((name) => {
      const clean = (value: string | null | undefined): string =>
        (value ?? "").replace(/\s+/g, " ").trim();
      const select = document.querySelector("#SelectBoxName");

      if (!(select instanceof HTMLSelectElement)) {
        return false;
      }

      const option = Array.from(select.options).find((currentOption) => {
        const text = clean(currentOption.textContent || currentOption.value);

        return text === name || text.startsWith(`${name} -`);
      });

      if (!option) {
        return false;
      }

      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));

      return true;
    }, petName)
    .catch(() => false);

  if (selectedFromPetDropdown) {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await wait(900);
    return;
  }

  const tab = page.getByText(petName, { exact: true }).first();

  if ((await tab.count()) === 0 || !(await tab.isVisible().catch(() => false))) {
    return;
  }

  await Promise.all([
    page.waitForLoadState("networkidle").catch(() => undefined),
    tab.click({ timeout: 5000 }).catch(() => undefined),
  ]);
  await wait(800);
};

const extractTextForDetails = async (page: Page): Promise<string> => {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const domText = (await extractDetailDomFields(page))
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");

  return `${bodyText}\n${domText}`;
};

const extractWeightKgFromText = (text: string): number | undefined => {
  const normalizedText = text
    .replace(/\u05f3/g, "'")
    .replace(/\u05f4/g, '"');
  const match =
    normalizedText.match(/(?:משקל|weight|wt)[^\d]{0,80}(\d+(?:[.,]\d+)?)/i) ??
    normalizedText.match(
      /(\d+(?:[.,]\d+)?)\s*(?:ק\s*['"]?\s*ג|קג|קילו|kg)/i,
    ) ??
    normalizedText.match(
      /(?:ק\s*['"]?\s*ג|קג|קילו|kg)\s*(\d+(?:[.,]\d+)?)/i,
    );

  return toNumberValue(match?.[1]);
};

const extractAgeFromText = (
  text: string,
): Pick<PetDetails, "ageYears" | "ageMonths"> => {
  const normalizedText = text
    .replace(/\u05f3/g, "'")
    .replace(/\u05f4/g, '"');
  const yearToken = String.raw`(?:שנים|שנה|ש\s*['"]?|years?|year)`;
  const monthToken = String.raw`(?:חודשים|חודש|ח\s*['"]?|months?|month)`;

  const combinedAgeMatch =
    normalizedText.match(
      new RegExp(
        String.raw`(\d+)\s*${yearToken}[^\d]{0,24}(\d+)\s*${monthToken}`,
        "i",
      ),
    ) ??
    normalizedText.match(
      new RegExp(
        String.raw`גיל[^\d]{0,60}(\d+)\s*${yearToken}(?:[^\d]{0,24}(\d+)\s*${monthToken})?`,
        "i",
      ),
    );

  if (combinedAgeMatch) {
    return {
      ageYears: toIntegerValue(combinedAgeMatch[1]),
      ageMonths: toIntegerValue(combinedAgeMatch[2]) ?? 0,
    };
  }

  const shorthandYearsMatch = normalizedText.match(/(\d+)\s*ש\s*['"]?/);
  const shorthandMonthsMatch = normalizedText.match(/(\d+)\s*ח\s*['"]?/);
  const shorthandDaysMatch = normalizedText.match(/(\d+)\s*י\s*['"]?/);
  const shorthandYears = toIntegerValue(shorthandYearsMatch?.[1]);
  const shorthandMonths = toIntegerValue(shorthandMonthsMatch?.[1]);

  if (shorthandYears !== undefined || shorthandMonths !== undefined) {
    return {
      ageYears: shorthandYears,
      ageMonths:
        shorthandMonths !== undefined && shorthandMonths <= 11
          ? shorthandMonths
          : shorthandYears !== undefined
            ? 0
            : undefined,
    };
  }

  if (shorthandDaysMatch) {
    return {
      ageYears: 0,
      ageMonths: 0,
    };
  }

  const decimalYearsMatch =
    normalizedText.match(
      /(?:גיל|שנים|שנה|years|year)[^\d]{0,80}(\d+(?:[.,]\d+))/i,
    ) ??
    normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(?:שנים|שנה|years|year)/i);
  const decimalYears = toNumberValue(decimalYearsMatch?.[1]);

  if (decimalYears !== undefined && !Number.isInteger(decimalYears)) {
    const ageYears = Math.floor(decimalYears);
    const ageMonths = Math.round((decimalYears - ageYears) * 12);

    return {
      ageYears,
      ageMonths: ageMonths <= 11 ? ageMonths : undefined,
    };
  }

  const yearsMatch = normalizedText.match(
    new RegExp(
      String.raw`(?:גיל\s*\(?שנים\)?|שנים|שנה|years?|year)[^\d]{0,80}(\d+)`,
      "i",
    ),
  );
  const monthsMatch = normalizedText.match(
    new RegExp(
      String.raw`(?:גיל\s*\(?חודשים\)?|חודשים|חודש|months?|month)[^\d]{0,80}(\d+)`,
      "i",
    ),
  );
  const ageYears = toIntegerValue(yearsMatch?.[1]);
  const rawMonths = toIntegerValue(monthsMatch?.[1]);

  if (ageYears === undefined && rawMonths !== undefined && rawMonths > 11) {
    return {
      ageYears: Math.floor(rawMonths / 12),
      ageMonths: rawMonths % 12,
    };
  }

  const ageMonths =
    rawMonths !== undefined && rawMonths <= 11 ? rawMonths : undefined;

  return {
    ageYears,
    ageMonths,
  };
};

const normalizePetNameKey = (value: string): string =>
  normalizeValue(value).replace(/[\\\/]+מ?$/g, "").trim();

const extractGenderFromText = (text: string): string | undefined => {
  if (text.includes("נקבה")) {
    return "נקבה";
  }

  if (text.includes("זכר")) {
    return "זכר";
  }

  return undefined;
};

const extractInsuranceFromText = (text: string): string | undefined => {
  const match = text.match(/מבוטח\s+(.+?)(?:\s+עד:|$)/);

  if (match?.[1]) {
    return normalizeValue(match[1]);
  }

  return text.includes("מבוטח") ? "מבוטח" : undefined;
};

const parsePetSummaryText = (text: string): ParsedPetSummary | null => {
  const cleanText = normalizeValue(text);

  if (!cleanText || !cleanText.includes(" - ")) {
    return null;
  }

  const parts = cleanText
    .split(/\s+-\s+/)
    .map(normalizeValue)
    .filter(Boolean);
  const name = normalizeValue(parts[0]);

  if (!name || name.includes("בחר")) {
    return null;
  }

  const age = extractAgeFromText(cleanText);
  const details: PetDetails = {
    species: parts[1],
    breed: parts[2],
    gender: extractGenderFromText(cleanText),
    weightKg: extractWeightKgFromText(cleanText),
    ageYears: age.ageYears,
    ageMonths: age.ageMonths,
    insurance: extractInsuranceFromText(cleanText),
  };

  return {
    name,
    details,
  };
};

const extractPetSummaryDetailsFromDetailPage = async (
  page: Page,
  row: ExtractedClientRow,
): Promise<Map<string, PetDetails>> => {
  const texts: string[] = [];
  const summaryField = page.locator("#TextBoxName").first();

  if ((await summaryField.count()) > 0) {
    texts.push(normalizeValue(await summaryField.inputValue().catch(() => "")));
  }

  const petSelect = page.locator("#SelectBoxName").first();

  if ((await petSelect.count()) > 0) {
    texts.push(normalizeValue(await petSelect.inputValue().catch(() => "")));
    texts.push(
      ...(await petSelect
        .locator("option")
        .allInnerTexts()
        .catch(() => [])),
    );
  }

  const detailsByPetName = new Map<string, PetDetails>();

  for (const text of Array.from(new Set(texts.map(normalizeValue).filter(Boolean)))) {
    const parsed = parsePetSummaryText(text);

    if (!parsed || !isValidExtractedPetName(parsed.name, row)) {
      continue;
    }

    const existing = detailsByPetName.get(parsed.name) ?? {};
    detailsByPetName.set(parsed.name, mergeDetails(existing, parsed.details));
  }

  return detailsByPetName;
};

const extractRobustPetDetails = async (page: Page): Promise<PetDetails> => {
  const scraperDetails = await clinicaScraperService.extractPatientDetailsFromPage(page);
  const text = await extractTextForDetails(page);
  const weightKg = scraperDetails.weightKg ?? extractWeightKgFromText(text);
  const age = extractAgeFromText(text);

  return {
    gender: normalizeValue(scraperDetails.gender) || undefined,
    breed: normalizeValue(scraperDetails.breed) || undefined,
    species: normalizeValue(scraperDetails.species) || undefined,
    color: normalizeValue(scraperDetails.color) || undefined,
    weightKg,
    ageYears: scraperDetails.ageYears ?? age.ageYears,
    ageMonths: scraperDetails.ageMonths ?? age.ageMonths,
    insurance: normalizeValue(scraperDetails.insurance) || undefined,
    treatingDoctor: normalizeValue(scraperDetails.treatingDoctor) || undefined,
    referringDoctor: normalizeValue(scraperDetails.referringDoctor) || undefined,
  };
};

const collectPetDetails = async (
  page: Page,
  petNames: string[],
): Promise<Map<string, PetDetails>> => {
  const detailsByPetName = new Map<string, PetDetails>();

  for (const petName of petNames) {
    await clickPetTab(page, petName);
    detailsByPetName.set(petName, await extractRobustPetDetails(page));
  }

  return detailsByPetName;
};

const detailsSignature = (details: PetDetails): string =>
  JSON.stringify({
    weightKg: details.weightKg,
    ageYears: details.ageYears,
    ageMonths: details.ageMonths,
  });

const removeUnsafeRepeatedDetails = (
  petNames: string[],
  detailsByPetName: Map<string, PetDetails>,
): Map<string, PetDetails> => {
  if (petNames.length <= 1) {
    return detailsByPetName;
  }

  const signatures = petNames
    .map((petName) => detailsSignature(detailsByPetName.get(petName) ?? {}))
    .filter((signature) => signature !== "{}");

  if (signatures.length <= 1 || new Set(signatures).size > 1) {
    return detailsByPetName;
  }

  console.warn(
    "[Clinica Backfill] dropping repeated age/weight for a multi-pet client",
  );

  const safeDetails = new Map<string, PetDetails>();

  for (const petName of petNames) {
    const details = { ...(detailsByPetName.get(petName) ?? {}) };

    delete details.weightKg;
    delete details.ageYears;
    delete details.ageMonths;
    safeDetails.set(petName, details);
  }

  return safeDetails;
};

const mergeDetails = (
  target: PetDetails,
  incoming: PetDetails,
): PetDetails => ({
  ...target,
  gender: target.gender ?? incoming.gender,
  breed: target.breed ?? incoming.breed,
  species: target.species ?? incoming.species,
  color: target.color ?? incoming.color,
  weightKg: target.weightKg ?? incoming.weightKg,
  ageYears: target.ageYears ?? incoming.ageYears,
  ageMonths: target.ageMonths ?? incoming.ageMonths,
  insurance: target.insurance ?? incoming.insurance,
  treatingDoctor: target.treatingDoctor ?? incoming.treatingDoctor,
  referringDoctor: target.referringDoctor ?? incoming.referringDoctor,
});

const mergeRowDetails = (
  row: ExtractedClientRow,
  details: PetDetails,
): void => {
  if (row.gender === undefined && details.gender !== undefined) row.gender = details.gender;
  if (row.breed === undefined && details.breed !== undefined) row.breed = details.breed;
  if (row.species === undefined && details.species !== undefined) row.species = details.species;
  if (row.color === undefined && details.color !== undefined) row.color = details.color;
  if (row.weightKg === undefined && details.weightKg !== undefined) row.weightKg = details.weightKg;
  if (row.ageYears === undefined && details.ageYears !== undefined) row.ageYears = details.ageYears;
  if (row.ageMonths === undefined && details.ageMonths !== undefined) row.ageMonths = details.ageMonths;
  if (row.insurance === undefined && details.insurance !== undefined) row.insurance = details.insurance;
  if (row.treatingDoctor === undefined && details.treatingDoctor !== undefined) {
    row.treatingDoctor = details.treatingDoctor;
  }
  if (row.referringDoctor === undefined && details.referringDoctor !== undefined) {
    row.referringDoctor = details.referringDoctor;
  }
};

const clickDetailTabsAndCollectRecords = async (
  page: Page,
  row: ExtractedClientRow,
): Promise<ClinicaMedicalRecordDto[]> => {
  const records: ClinicaMedicalRecordDto[] = [];
  const tabs = [
    { selector: "#tab_Second", type: "customerFollowUp" },
    { selector: "#tab_Third", type: "doctorJournal" },
    { selector: "#ctl00_MainContent_tab_Fourth", type: "doctorJournalExtra" },
    { selector: "#tab_Fifth", type: "rabiesReport" },
    { selector: "#tab_Sixth", type: "visitDetails" },
  ];

  for (const tab of tabs) {
    try {
      const tabElement = page.locator(tab.selector);

      if ((await tabElement.count()) === 0) {
        continue;
      }

      const isVisible = await tabElement.isVisible().catch(() => false);

      if (!isVisible) {
        continue;
      }

      await Promise.all([
        page.waitForLoadState("networkidle").catch(() => undefined),
        tabElement.click({ timeout: 5000 }),
      ]);
      await wait(1000);

      const rawText = await page.locator("body").innerText().catch(() => "");
      const scraperDetails = clinicaScraperService.extractPatientDetails(rawText);
      const details = {
        ...scraperDetails,
        ...extractAgeFromText(rawText),
        weightKg: scraperDetails.weightKg ?? extractWeightKgFromText(rawText),
      };

      mergeRowDetails(row, details);

      const cleanText = clinicaScraperService.cleanMedicalText(rawText);

      if (!cleanText) {
        continue;
      }

      for (const petName of row.petNames) {
        records.push({
          patientName: petName,
          ownerName: row.ownerName,
          ownerPhone: row.ownerPhone,
          recordType: tab.type,
          rawText: cleanText,
          syncedAt: new Date(),
        });
      }
    } catch {
      continue;
    }
  }

  return records;
};

const returnToClientsPage = async (page: Page): Promise<void> => {
  try {
    await page.goBack({
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    await waitForClientsRows(page);
    await wait(800);

    return;
  } catch {
    // Fall back to Clinica's own return link below.
  }

  const backToClientsLink = page
    .getByText("חזרה לרשימת לקוחות", { exact: false })
    .first();

  if (
    (await backToClientsLink.count()) > 0 &&
    (await backToClientsLink.isVisible().catch(() => false))
  ) {
    const href = await backToClientsLink.getAttribute("href").catch(() => null);

    if (href) {
      await page.goto(new URL(href, ENV.clinicaBaseUrl).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } else {
      await backToClientsLink.click({ force: true, timeout: 10000 });
    }
  } else {
    await page.goBack({
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
  }

  await page.waitForLoadState("networkidle").catch(() => undefined);
  await waitForClientsRows(page);
  await wait(800);
};

const clickNextClientsPage = async (
  page: Page,
  delayMs: number,
): Promise<boolean> => {
  const before = await getVisibleClientIdsSignature(page);
  const candidates = [
    "#button_MoreRecords",
    'input[type="button"][value="הבא"]',
    "#nextDay2",
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();
    const visible =
      (await locator.count()) > 0 && (await locator.isVisible().catch(() => false));

    if (!visible) {
      continue;
    }

    await locator
      .evaluate((element) => {
        const input = element as HTMLInputElement;

        input.disabled = false;
        input.removeAttribute("disabled");
        element.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
        element.dispatchEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
      })
      .catch(async () => {
        await locator.click({ force: true, timeout: 5000 });
      });

    await page.waitForLoadState("networkidle").catch(() => undefined);
    await wait(Math.max(delayMs, 700));
    await waitForClientsRows(page);

    const after = await getVisibleClientIdsSignature(page);

    if (after && after !== before) {
      console.log(`[Clinica Backfill] advanced with ${selector}`);
      return true;
    }

    console.warn(`[Clinica Backfill] ${selector} did not change rows`);
  }

  const invoked = await page
    .evaluate<boolean>(() => {
      const list = window as typeof window & {
        mypListVet?: {
          moreRecords1?: (event: MouseEvent) => void;
        };
      };

      if (typeof list.mypListVet?.moreRecords1 !== "function") {
        return false;
      }

      list.mypListVet.moreRecords1(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );

      return true;
    })
    .catch(() => false);

  if (!invoked) {
    return false;
  }

  await page.waitForLoadState("networkidle").catch(() => undefined);
  await wait(Math.max(delayMs, 700));
  await waitForClientsRows(page);

  const after = await getVisibleClientIdsSignature(page);

  if (after && after !== before) {
    console.log("[Clinica Backfill] advanced with mypListVet.moreRecords1");
    return true;
  }

  return false;
};

const goToPage = async (
  page: Page,
  pageNumber: number,
  delayMs: number,
  allClients: boolean,
): Promise<void> => {
  await openStartClientsPage(page, allClients);

  for (let currentPage = 1; currentPage < pageNumber; currentPage += 1) {
    const advanced = await clickNextClientsPage(page, delayMs);

    if (!advanced) {
      throw new Error(
        `Could not advance Clinica clients page from ${currentPage} to ${
          currentPage + 1
        }`,
      );
    }
  }
};

const advanceToNextClientsPage = async (
  page: Page,
  currentPage: number,
  delayMs: number,
  allClients: boolean,
): Promise<boolean> => {
  if (await clickNextClientsPage(page, delayMs)) {
    return true;
  }

  console.warn(
    `[Clinica Backfill] advance from page ${currentPage} failed once; reopening page ${currentPage} and retrying`,
  );

  try {
    await goToPage(page, currentPage, delayMs, allClients);

    return clickNextClientsPage(page, delayMs);
  } catch (error) {
    console.warn(
      `[Clinica Backfill] retry advance from page ${currentPage} failed: ${getErrorMessage(error)}`,
    );

    return false;
  }
};

const buildClient = (
  row: ExtractedClientRow,
  detailsByPetName: Map<string, PetDetails>,
  pageNumber: number,
  medicalRecords: ClinicaMedicalRecordDto[],
): IClinicaBackfillClient | null => {
  const externalPatientId = normalizeValue(row.externalPatientId);
  const ownerName = normalizeValue(row.ownerName);
  const ownerPhone = normalizeValue(row.ownerPhone);
  const petNames = Array.from(new Set(row.petNames.map(normalizeValue).filter(Boolean)));

  if (!externalPatientId || !ownerName || !ownerPhone || petNames.length === 0) {
    return null;
  }

  const pets = petNames.map((petName) => {
    const details = detailsByPetName.get(petName) ?? {};

    return {
      name: petName,
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
    };
  });

  return {
    externalPatientId,
    ownerName,
    ownerPhone,
    pets,
    sourceDetailStatus: "detail",
    rawData: {
      source: "clinica-online-backfill-plus",
      pageNumber,
      recordsCount: medicalRecords.length,
      original: {
        row,
        medicalRecords,
      },
    },
    sourceTag: "new",
    lastBackfilledAt: new Date(),
  };
};

const buildListOnlyClient = (
  row: ExtractedClientRow,
  pageNumber: number,
  reason: string,
): IClinicaBackfillClient | null => {
  const externalPatientId = normalizeValue(row.externalPatientId);
  const ownerName = normalizeValue(row.ownerName);
  const ownerPhone = normalizeValue(row.ownerPhone);

  if (!externalPatientId || !ownerName || !ownerPhone) {
    return null;
  }

  const knownPetNames = Array.from(
    new Set(row.petNames.map(normalizeValue).filter(Boolean)),
  ).filter((name) => isValidExtractedPetName(name, row));

  return {
    externalPatientId,
    ownerName,
    ownerPhone,
    pets: knownPetNames.map((name) => ({ name })),
    sourceDetailStatus: "list",
    rawData: {
      source: "clinica-online-backfill-list",
      pageNumber,
      reason,
      original: {
        row,
      },
    },
    sourceTag: "new",
    lastBackfilledAt: new Date(),
  };
};

const upsertClient = async (
  client: IClinicaBackfillClient,
  dryRun: boolean,
): Promise<{ inserted: boolean; updated: boolean; unchanged: boolean }> => {
  const existing = await ClinicaBackfillClientModel.findOne({
    externalPatientId: client.externalPatientId,
  }).lean();

  if (
    existing?.sourceDetailStatus === "detail" &&
    client.sourceDetailStatus === "list"
  ) {
    return {
      inserted: false,
      updated: false,
      unchanged: true,
    };
  }

  if (!dryRun) {
    await ClinicaBackfillClientModel.updateOne(
      { externalPatientId: client.externalPatientId },
      { $set: client },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  return {
    inserted: !existing,
    updated: Boolean(existing),
    unchanged: false,
  };
};

export const runClinicaBackfillClients = async (
  options: BackfillOptions,
): Promise<Checkpoint> => {
  const mode = getBackfillMode(options);

  if (options.resetNew || options.clearNewOnly) {
    if (options.dryRun) {
      console.log("[Clinica Backfill] dry-run: would clear clinica_backfill_clients");
    } else {
      const result = await ClinicaBackfillClientModel.deleteMany({});
      console.log(`[Clinica Backfill] cleared clinica_backfill_clients: ${result.deletedCount}`);
      await resetCheckpoint();
      await resetFailures();
    }
  }

  if (options.clearNewOnly) {
    return { ...EMPTY_CHECKPOINT };
  }

  let checkpoint = options.resume
    ? await readCheckpoint()
    : { ...EMPTY_CHECKPOINT };

  if (options.resume && checkpoint.mode !== mode) {
    console.warn(
      `[Clinica Backfill] checkpoint mode is ${checkpoint.mode ?? "unknown"}, current mode is ${mode}; starting from page 1 instead of resuming an incompatible run`,
    );
    checkpoint = { ...EMPTY_CHECKPOINT };
  }

  checkpoint.mode = mode;

  const fromPage = options.resume
    ? Math.max(checkpoint.lastCompletedPage + 1, 1)
    : Math.max(options.fromPage, 1);

  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await clinicaScraperService.login(page, {
      username: ENV.clinicUsername,
      password: ENV.clinicPassword,
    });
    await clinicaScraperService.selectClinicCenterIfNeeded(page);
    await goToPage(page, fromPage, options.delayMs, options.allClients);

    let currentPage = fromPage;
    let processedInBatch = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      if (isDeadlineReached(options.deadline)) {
        console.log(
          `[Clinica Backfill] deadline reached, stopping before page ${currentPage}`,
        );
        break;
      }

      const allRows = await extractBackfillClientRows(page);
      const rows = options.plusOnly ? allRows.filter(hasPlusPetSplit) : allRows;
      const plusRowsCount = allRows.filter(hasPlusPetSplit).length;
      const listOnlyRowsCount = options.plusOnly ? allRows.length - plusRowsCount : 0;

      if (options.dryRun && options.plusOnly && plusRowsCount === 0 && allRows.length > 0) {
        console.warn(
          "[Clinica Backfill] no plus rows detected; sample rows:",
          allRows.slice(0, 3).map((row) => ({
            externalPatientId: row.externalPatientId,
            ownerName: row.ownerName,
            ownerPhone: row.ownerPhone,
            petNames: row.petNames,
          })),
        );
      }

      if (allRows.length === 0) {
        console.warn(
          `[Clinica Backfill] page ${currentPage} returned 0 client rows; stopping to avoid paging blindly`,
        );
        break;
      }

      let pageSaved = 0;
      let pageSkipped = 0;
      let pageFailed = 0;
      let pageWithAge = 0;
      let pageWithWeight = 0;
      let pageListOnlySaved = 0;
      let pageBasicPetSaved = 0;
      let pageInterrupted = false;

      for (const row of rows) {
        if (options.limit && checkpoint.processed >= options.limit) {
          shouldContinue = false;
          break;
        }

        if (isDeadlineReached(options.deadline)) {
          console.log(
            `[Clinica Backfill] deadline reached, stopping mid-page ${currentPage}`,
          );
          shouldContinue = false;
          break;
        }

        let openedDetailPage = false;

        const saveListOnlyFallback = async (reason: string): Promise<boolean> => {
          if (options.detailsOnly) {
            return false;
          }

          const listOnlyClient = buildListOnlyClient(row, currentPage, reason);

          if (!listOnlyClient) {
            return false;
          }

          const result = await upsertClient(listOnlyClient, options.dryRun);

          if (result.inserted) checkpoint.inserted += 1;
          if (result.updated) checkpoint.updated += 1;

          if (!result.unchanged) {
            pageSaved += 1;
            pageListOnlySaved += 1;
          }

          return true;
        };

        try {
          let opened = await openClientDetailFromCurrentPage(page, row);

          if (!opened) {
            await goToPage(
              page,
              currentPage,
              options.delayMs,
              options.allClients,
            );
            opened = await openClientDetailFromCurrentPage(page, row);
          }

          if (!opened) {
            await logFailure({
              type: "detail_open_failed",
              externalPatientId: row.externalPatientId,
              ownerName: row.ownerName,
            });

            if (await saveListOnlyFallback("detail_open_failed")) {
              continue;
            }

            checkpoint.skipped += 1;
            pageSkipped += 1;
            continue;
          }

          openedDetailPage = true;

          await dismissBlockingAlertIfPresent(page);

          const summaryDetailsByPetName =
            await extractPetSummaryDetailsFromDetailPage(page, row);
          let petNames = await resolvePetNamesForOpenedDetail(
            page,
            row,
            summaryDetailsByPetName,
          );
          let usedBasicPetFallback = false;

          if (petNames.length === 0) {
            const basicPet = await extractBasicPetFromDetailPage(page, row);

            if (basicPet) {
              petNames = [basicPet.name];
              summaryDetailsByPetName.set(
                basicPet.name,
                mergeDetails(
                  summaryDetailsByPetName.get(basicPet.name) ?? {},
                  basicPet.details,
                ),
              );
              usedBasicPetFallback = true;
            }
          }

          if (petNames.length === 0) {
            await logFailure({
              type: "pet_names_missing",
              externalPatientId: row.externalPatientId,
              ownerName: row.ownerName,
              reason: "could not extract a real pet name from detail page",
            });

            if (await saveListOnlyFallback("pet_names_missing")) {
              continue;
            }

            checkpoint.skipped += 1;
            pageSkipped += 1;
            continue;
          }

          row.petNames = petNames;
          if (usedBasicPetFallback) {
            pageBasicPetSaved += 1;
          }

          const tabDetailsByPetName = await collectPetDetails(page, row.petNames);
          let detailsByPetName = new Map<string, PetDetails>();

          for (const petName of row.petNames) {
            const summaryDetails =
              summaryDetailsByPetName.get(petName) ??
              summaryDetailsByPetName.get(normalizePetNameKey(petName)) ??
              {};
            const tabDetails = tabDetailsByPetName.get(petName) ?? {};

            detailsByPetName.set(petName, mergeDetails(summaryDetails, tabDetails));
          }

          const medicalRecords: ClinicaMedicalRecordDto[] = [];

          if (row.petNames.length === 1) {
            for (const petName of row.petNames) {
              const existingDetails = detailsByPetName.get(petName) ?? {};

              detailsByPetName.set(petName, mergeDetails(existingDetails, {
                gender: row.gender,
                breed: row.breed,
                species: row.species,
                color: row.color,
                weightKg: row.weightKg,
                ageYears: row.ageYears,
                ageMonths: row.ageMonths,
                insurance: row.insurance,
                treatingDoctor: row.treatingDoctor,
                referringDoctor: row.referringDoctor,
              }));
            }
          }

          detailsByPetName = removeUnsafeRepeatedDetails(row.petNames, detailsByPetName);

          const client = buildClient(
            row,
            detailsByPetName,
            currentPage,
            medicalRecords,
          );

          if (!client) {
            await logFailure({
              type: "validation",
              externalPatientId: row.externalPatientId,
              ownerName: row.ownerName,
              reason: "missing required fields after normalization",
            });

            if (await saveListOnlyFallback("detail_validation_failed")) {
              continue;
            }

            checkpoint.skipped += 1;
            pageSkipped += 1;
          } else {
            const result = await upsertClient(client, options.dryRun);

            if (result.inserted) checkpoint.inserted += 1;
            if (result.updated) checkpoint.updated += 1;

            pageSaved += 1;
            pageWithAge += client.pets.filter(
              (pet) => pet.ageYears !== undefined || pet.ageMonths !== undefined,
            ).length;
            pageWithWeight += client.pets.filter(
              (pet) => pet.weightKg !== undefined,
            ).length;
          }
        } catch (error) {
          checkpoint.failed += 1;
          pageFailed += 1;
          await logFailure({
            type: "row_exception",
            externalPatientId: row.externalPatientId,
            ownerName: row.ownerName,
            reason: getErrorMessage(error),
          });
        } finally {
          checkpoint.processed += 1;
          processedInBatch += 1;

          try {
            const isStillOnClientsPage = await getClientsTable(page)
              .isVisible({ timeout: 1000 })
              .catch(() => false);

            if (openedDetailPage || !isStillOnClientsPage) {
              await returnToClientsPage(page);
            }
          } catch (error) {
            await logFailure({
              type: "restore_page_failed",
              page: currentPage,
              reason: getErrorMessage(error),
            });

            console.warn(
              `[Clinica Backfill] could not restore page ${currentPage}; checkpoint saved and run will stop safely: ${getErrorMessage(error)}`,
            );

            pageInterrupted = true;
            shouldContinue = false;

            if (!options.dryRun) {
              await writeCheckpoint(checkpoint);
            }
          }

          if (processedInBatch >= options.batchSize) {
            checkpoint.batchesCompleted += 1;

            if (!options.dryRun) {
              await writeCheckpoint(checkpoint);
            }

            console.log(
              `[Clinica Backfill] batch ${checkpoint.batchesCompleted} checkpoint: processed=${checkpoint.processed} inserted=${checkpoint.inserted} updated=${checkpoint.updated} skipped=${checkpoint.skipped} failed=${checkpoint.failed}`,
            );
            processedInBatch = 0;
          }
        }

        if (pageInterrupted) {
          break;
        }
      }

      if (!pageInterrupted) {
        checkpoint.lastCompletedPage = currentPage;
      }

      if (!options.dryRun) {
        await writeCheckpoint(checkpoint);
      }

      console.log(
        `[Clinica Backfill] page ${currentPage} done: rows=${allRows.length} plusRows=${plusRowsCount} listOnlySkipped=${listOnlyRowsCount} saved=${pageSaved} basicPetSaved=${pageBasicPetSaved} listOnlySaved=${pageListOnlySaved} skipped=${pageSkipped} failed=${pageFailed} withAge=${pageWithAge} withWeight=${pageWithWeight} processed=${checkpoint.processed} inserted=${checkpoint.inserted} updated=${checkpoint.updated}`,
      );

      if (!shouldContinue) {
        break;
      }

      const advanced = await advanceToNextClientsPage(
        page,
        currentPage,
        options.delayMs,
        options.allClients,
      );

      if (!advanced) {
        console.warn(
          `[Clinica Backfill] stopping after page ${currentPage}: could not advance to next page`,
        );
        break;
      }

      currentPage += 1;
      await wait(options.delayMs);
    }

    return checkpoint;
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};

export type ListOnlyBackfillOptions = {
  dryRun: boolean;
  delayMs: number;
  fromPage: number;
};

export type ListOnlyBackfillResult = {
  pagesProcessed: number;
  rowsSeen: number;
  inserted: number;
  updated: number;
  unchanged: number;
};

// Deliberately does not open a single client detail page. Every failure we
// have chased today comes from this site not reliably restoring the clients
// list after a detail page is opened and closed. This pass only ever walks
// forward through pages (the one navigation primitive we have solid evidence
// works reliably) and saves whatever each page shows immediately, so it
// cannot get stuck on the "return to the right page" problem at all. It
// covers every client with at least owner/phone/id, plus any pet name
// already visible in the list, in a fraction of the time the detail pass
// takes. The existing detail-opening pass can still run afterward to
// upgrade whichever clients it manages to reach.
export const runClinicaListOnlyBackfill = async (
  options: ListOnlyBackfillOptions,
): Promise<ListOnlyBackfillResult> => {
  await clinicaScraperService.init();

  const browser = clinicaScraperService.getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  const result: ListOnlyBackfillResult = {
    pagesProcessed: 0,
    rowsSeen: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
  };

  try {
    await clinicaScraperService.login(page, {
      username: ENV.clinicUsername,
      password: ENV.clinicPassword,
    });
    await clinicaScraperService.selectClinicCenterIfNeeded(page);

    let currentPage = Math.max(options.fromPage, 1);

    await goToPage(page, currentPage, options.delayMs, true);

    for (;;) {
      const rows = await extractBackfillClientRows(page);

      if (rows.length === 0) {
        console.warn(
          `[Clinica List-Only Backfill] page ${currentPage} returned 0 rows; stopping`,
        );
        break;
      }

      for (const row of rows) {
        const client = buildListOnlyClient(row, currentPage, "list-only-pass");

        if (!client) {
          continue;
        }

        result.rowsSeen += 1;

        const upsertResult = await upsertClient(client, options.dryRun);

        if (upsertResult.inserted) result.inserted += 1;
        else if (upsertResult.updated) result.updated += 1;
        else result.unchanged += 1;
      }

      result.pagesProcessed += 1;

      console.log(
        `[Clinica List-Only Backfill] page ${currentPage} done: rows=${rows.length} inserted=${result.inserted} updated=${result.updated} unchanged=${result.unchanged}`,
      );

      const advanced = await advanceToNextClientsPage(
        page,
        currentPage,
        options.delayMs,
        true,
      );

      if (!advanced) {
        console.warn(
          `[Clinica List-Only Backfill] stopping after page ${currentPage}: could not advance to next page`,
        );
        break;
      }

      currentPage += 1;
      await wait(options.delayMs);
    }

    return result;
  } finally {
    await context.close().catch(() => undefined);
    await clinicaScraperService.close().catch(() => undefined);
  }
};
