import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { chromium, type Locator, type Page } from "playwright";
import { ENV } from "../src/config/config.js";
import { ClinicaScraperService } from "../src/services/clinicaScraper.service.js";

const EXPECTED_CLIENT_COUNT = 17_373;
const CLIENTS_PER_PAGE = 20;
const CLIENT_LIST_URL =
  "https://ww2.clinicaonline.co.il/vetclinic/therapists/patientlistvet.aspx";
const CLIENT_PAGE_PATH = "/vetclinic/patientsa/vet/registerp3vet.aspx";
const CLIENT_PAGE_URL =
  "https://ww2.clinicaonline.co.il/vetclinic/PatientsA/vet/registerp3vet.aspx";
const PETEC_CLINICA_URL = "http://localhost:5173/clinica";
const SYNC_TIMEOUT_MS = 30 * 60_000;

const scraper = new ClinicaScraperService();

const loginAndOpenClientList = async (page: Page): Promise<void> => {
  await scraper.login(page, {
    username: ENV.clinicUsername,
    password: ENV.clinicPassword,
  });
  await scraper.selectClinicCenterIfNeeded(page);
  await page.goto(CLIENT_LIST_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.locator("#SelectFilter").waitFor({
    state: "visible",
    timeout: 30_000,
  });
};

const getClientNumberTable = (page: Page): Locator =>
  page
    .getByText(/מס['׳’]?\s*לקוח/, { exact: false })
    .first()
    .locator("xpath=ancestor::table[1]");

const getClientNumberColumnIndex = async (table: Locator): Promise<number> => {
  const headers = await table.locator("tr").first().locator("th, td").allTextContents();
  const index = headers.findIndex((header) =>
    /מס['׳’]?\s*לקוח/.test(header.replace(/\s+/g, " ").trim()),
  );
  if (index < 0) throw new Error('The "מס\' לקוח" column was not found');
  return index;
};

const getClientNumberCells = async (page: Page): Promise<Locator[]> => {
  const table = getClientNumberTable(page);
  await table.waitFor({ state: "visible", timeout: 30_000 });
  const columnIndex = await getClientNumberColumnIndex(table);
  const rows = table.locator("tr").filter({ has: page.locator("td") });
  const cells: Locator[] = [];

  for (let rowIndex = 0; rowIndex < await rows.count(); rowIndex += 1) {
    const row = rows.nth(rowIndex);
    const cell = row.locator("td").nth(columnIndex);
    const clientNumber = (await cell.innerText().catch(() => ""))
      .replace(/\s+/g, " ")
      .trim();
    if (/^\d+$/.test(clientNumber)) cells.push(cell);
  }
  return cells;
};

const getPageSignature = async (page: Page): Promise<string> =>
  (await getClientNumberCells(page))
    .map((cell) => cell.innerText().then((text) => text.trim()))
    .reduce(async (textsPromise, textPromise) => [
      ...await textsPromise,
      await textPromise,
    ], Promise.resolve([] as string[]))
    .then((texts) => texts.join("|"));

const selectFullClientList = async (page: Page): Promise<void> => {
  const filter = page.locator("#SelectFilter");
  const before = await getPageSignature(page).catch(() => "");
  // Clinica uses value 7 for "רשימת לקוחות". Selecting by value avoids the
  // similarly worded "20 אחרונים" option.
  await filter.selectOption("7");

  const deadline = Date.now() + 10_000;
  let changed = false;
  while (Date.now() < deadline) {
    const current = await getPageSignature(page).catch(() => "");
    if (current && current !== before) {
      changed = true;
      break;
    }
    await page.waitForTimeout(200);
  }

  if (!changed) {
    const refresh = page.locator("#button1, #button2").first();
    if (await refresh.count()) {
      await refresh.click();
      await page.waitForTimeout(500);
    }
  }

  const selectedValue = await filter.inputValue();
  const selectedText = (await filter.locator("option:checked").innerText())
    .replace(/\s+/g, " ")
    .trim();
  if (selectedValue !== "7") {
    throw new Error(
      `The full client list is not selected (value=${selectedValue}, label=${selectedText})`,
    );
  }
  console.log(`Confirmed full-list filter: "${selectedText}" (value 7).`);
};

const isClientDetailsPage = (urlValue: string): boolean => {
  try {
    const url = new URL(urlValue);
    return url.hostname === "ww2.clinicaonline.co.il" &&
      url.pathname.toLowerCase() === CLIENT_PAGE_PATH;
  } catch {
    return false;
  }
};

const openClientNumber = async (
  detailPage: Page,
  cell: Locator,
): Promise<string> => {
  const clientNumber = (await cell.innerText()).replace(/\s+/g, " ").trim();
  const url = new URL(CLIENT_PAGE_URL);
  url.searchParams.set("action", "showform");
  url.searchParams.set("petid", clientNumber);
  await detailPage.goto(url.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  if (!isClientDetailsPage(detailPage.url())) {
    throw new Error(`Unexpected client page: ${detailPage.url()}`);
  }
  await detailPage.locator("#TextBoxPetName").waitFor({
    state: "attached",
    timeout: 30_000,
  });
  return clientNumber;
};

const moveToNextPage = async (page: Page, previousSignature: string): Promise<boolean> => {
  let next = page.getByText("הבא", { exact: true }).last();
  if (!await next.count()) next = page.locator("#button_MoreRecords").first();
  if (!await next.count() || !await next.isVisible().catch(() => false)) return false;

  const disabled = await next.evaluate((element) =>
    (element as HTMLButtonElement).disabled ||
    element.getAttribute("aria-disabled") === "true",
  ).catch(() => true);
  if (disabled) return false;

  await next.click();
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const signature = await getPageSignature(page).catch(() => "");
    if (signature && signature !== previousSignature) return true;
    await page.waitForTimeout(250);
  }
  throw new Error('Clicked "הבא", but the client page did not change');
};

const recoverClientList = async (page: Page): Promise<void> => {
  if (page.url().toLowerCase().includes("patientlistvet.aspx")) return;
  await page.goBack({ waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => undefined);
  if (!page.url().toLowerCase().includes("patientlistvet.aspx")) {
    await page.goto(CLIENT_LIST_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await selectFullClientList(page);
  }
  await getClientNumberTable(page).waitFor({ state: "visible", timeout: 30_000 });
};

const waitForPetecLogin = async (
  page: Page,
  input: ReturnType<typeof createInterface>,
): Promise<void> => {
  await page.goto(PETEC_CLINICA_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  let syncButton = page.getByRole("button", { name: "סנכרון ידני", exact: true });
  if (!await syncButton.isVisible().catch(() => false)) {
    await page.bringToFront();
    await input.question(
      'The local PETEC page is open. Log in if needed, then press Enter here...',
    );
    await page.goto(PETEC_CLINICA_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    syncButton = page.getByRole("button", { name: "סנכרון ידני", exact: true });
  }
  await syncButton.waitFor({ state: "visible", timeout: 30_000 });
};

const runPetecManualSync = async (page: Page): Promise<string> => {
  await page.bringToFront();
  const syncButton = page.getByRole("button", {
    name: "סנכרון ידני",
    exact: true,
  });
  await syncButton.waitFor({ state: "visible", timeout: 30_000 });
  await syncButton.click();

  const success = page.getByText(
    /^הסנכרון הסתיים בהצלחה:\s*\d+\s+נוצרו,\s*\d+\s+עודכנו$/,
  );
  await success.waitFor({ state: "visible", timeout: SYNC_TIMEOUT_MS });
  return (await success.innerText()).replace(/\s+/g, " ").trim();
};

const main = async (): Promise<void> => {
  if (!ENV.clinicUsername || !ENV.clinicPassword) {
    throw new Error("CLINIC_USERNAME and CLINIC_PASSWORD are required");
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const detailPage = await context.newPage();
  const petecPage = await context.newPage();
  const input = createInterface({ input: stdin, output: stdout });
  let attempted = 0;
  let pageNumber = 1;

  try {
    console.log(`Opening local PETEC at ${PETEC_CLINICA_URL}`);
    await waitForPetecLogin(petecPage, input);
    await page.bringToFront();
    console.log(`Opening ${CLIENT_LIST_URL}`);
    await loginAndOpenClientList(page);
    console.log('Selecting "סינון לפי" -> "רשימת לקוחות"...');
    await selectFullClientList(page);

    while (attempted < EXPECTED_CLIENT_COUNT) {
      const signature = await getPageSignature(page);
      const initialCells = await getClientNumberCells(page);
      if (initialCells.length === 0) throw new Error(`No clients found on page ${pageNumber}`);
      if (initialCells.length > CLIENTS_PER_PAGE) {
        console.warn(`Page ${pageNumber} contains ${initialCells.length} clients (expected at most 20).`);
      }

      console.log(`Page ${pageNumber}: opening ${initialCells.length} clients...`);
      for (let index = 0; index < initialCells.length; index += 1) {
        // Re-read the table because returning from a client page replaces its DOM.
        const currentCells = await getClientNumberCells(page);
        const cell = currentCells[index];
        const clientNumber = (await cell.innerText().catch(() => `row ${index + 1}`))
          .replace(/\s+/g, " ")
          .trim();
        attempted += 1;
        try {
          await openClientNumber(detailPage, cell);
          console.log(`[${attempted}/${EXPECTED_CLIENT_COUNT}] Opened client ${clientNumber}`);
        } catch (error) {
          console.error(
            `[${attempted}/${EXPECTED_CLIENT_COUNT}] Failed client ${clientNumber}; continuing: ${error instanceof Error ? error.message : String(error)}`,
          );
          await recoverClientList(page);
        }
      }

      console.log(`Finished the ${initialCells.length} clients on Clinica page ${pageNumber}.`);
      console.log('Starting PETEC "סנכרון ידני"...');
      const result = await runPetecManualSync(petecPage);
      console.log(result);
      await input.question(
        'PETEC sync finished. Press Enter to click "הבא" in Clinica...',
      );

      await page.bringToFront();
      if (!await moveToNextPage(page, signature)) break;
      pageNumber += 1;
    }

    console.log(`Finished: opened ${attempted} clients across ${pageNumber} Clinica pages.`);
    if (attempted !== EXPECTED_CLIENT_COUNT) {
      console.warn(`Clinica ended at ${attempted}; the expected count was ${EXPECTED_CLIENT_COUNT}.`);
    }
    await input.question("Press Enter to close the Clinica browser...");
  } finally {
    input.close();
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
