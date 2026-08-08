import { chromium, type BrowserContext, type Page } from "playwright";
import { ENV } from "../src/config/config.js";
import { ClinicaScraperService } from "../src/services/clinicaScraper.service.js";

// Override these with CLINICA_CLIENT_NUMBER_START/END when resuming a run.
const CLIENT_NUMBER_START = Number(
  process.env.CLINICA_CLIENT_NUMBER_START ?? 15_000,
);
const CLIENT_NUMBER_END = Number(
  process.env.CLINICA_CLIENT_NUMBER_END ?? 17_737,
);
const SUCCESSFUL_CLIENTS_PER_WORKER_SYNC = 10;

const CLIENT_LIST_URL =
  "https://ww2.clinicaonline.co.il/vetclinic/therapists/patientlistvet.aspx";
const CLIENT_DETAILS_PATH = "/vetclinic/patientsa/vet/registerp3vet.aspx";
const PETEC_CLINICA_URL = "http://localhost:5173/clinica";
const CLIENT_NUMBER_SEARCH_VALUE = "5";
const SEARCH_TIMEOUT_MS = 4_000;
const PAGE_OPERATION_TIMEOUT_MS = 15_000;
const SYNC_TIMEOUT_MS = 30 * 60_000;
const PETEC_LOGIN_TIMEOUT_MS = 10 * 60_000;

const scraper = new ClinicaScraperService();

interface WorkerResult {
  opened: number;
  skipped: number;
}

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const openClinicaClientList = async (page: Page): Promise<void> => {
  await scraper.login(page, {
    username: ENV.clinicUsername,
    password: ENV.clinicPassword,
  });
  await scraper.selectClinicCenterIfNeeded(page);
  await page.goto(CLIENT_LIST_URL, {
    waitUntil: "commit",
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
  await page.locator("#TextBoxSearch").waitFor({
    state: "visible",
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
};

const returnToClientList = async (page: Page): Promise<void> => {
  await page.goto(CLIENT_LIST_URL, {
    waitUntil: "commit",
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
  await page.locator("#TextBoxSearch").waitFor({
    state: "visible",
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
};

const selectClientNumberSearch = async (page: Page): Promise<void> => {
  const searchType = page.locator("#ctl00_PageName_selectType");
  await searchType.waitFor({
    state: "visible",
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
  if ((await searchType.inputValue()) !== CLIENT_NUMBER_SEARCH_VALUE) {
    await searchType.selectOption(CLIENT_NUMBER_SEARCH_VALUE, {
      timeout: PAGE_OPERATION_TIMEOUT_MS,
    });
  }
};

const hasVisibleClientNumberSpan = async (
  page: Page,
  clientNumber: string,
): Promise<boolean> =>
  page.evaluate(
    (expected) =>
      Array.from(document.querySelectorAll<HTMLElement>("span")).some(
        (span) => {
          const text = (span.textContent ?? "").replace(/\s+/g, " ").trim();
          const numberTokens = text.match(/\d+/g) ?? [];
          const style = window.getComputedStyle(span);
          const isVisible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            span.getClientRects().length > 0;
          return isVisible && numberTokens.includes(expected);
        },
      ),
    clientNumber,
  );

const searchForExactClient = async (
  page: Page,
  clientNumber: string,
): Promise<boolean> => {
  await selectClientNumberSearch(page);
  await page.locator("#TextBoxSearch").fill(clientNumber, {
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });
  await page.locator("#search1").click({
    noWaitAfter: true,
    timeout: PAGE_OPERATION_TIMEOUT_MS,
  });

  const deadline = Date.now() + SEARCH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (
      await hasVisibleClientNumberSpan(page, clientNumber).catch(() => false)
    ) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
};

const clickExactClientNumber = async (
  page: Page,
  clientNumber: string,
): Promise<boolean> =>
  page.evaluate((expected) => {
    const span = Array.from(
      document.querySelectorAll<HTMLElement>("span"),
    ).find((candidate) => {
      const text = (candidate.textContent ?? "").replace(/\s+/g, " ").trim();
      const numberTokens = text.match(/\d+/g) ?? [];
      const style = window.getComputedStyle(candidate);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        candidate.getClientRects().length > 0 &&
        numberTokens.includes(expected)
      );
    });
    if (span) {
      span.click();
      return true;
    }
    return false;
  }, clientNumber);

const openClientAndReturn = async (
  page: Page,
  clientNumber: string,
): Promise<void> => {
  if (!(await clickExactClientNumber(page, clientNumber))) {
    throw new Error(
      "Exact search-result row disappeared before it could be clicked",
    );
  }
  await page.waitForURL(
    (url) =>
      url.hostname === "ww2.clinicaonline.co.il" &&
      url.pathname.toLowerCase() === CLIENT_DETAILS_PATH &&
      url.searchParams.get("action") === "showform" &&
      url.searchParams.has("petid"),
    { timeout: PAGE_OPERATION_TIMEOUT_MS, waitUntil: "commit" },
  );
  await page.waitForTimeout(300);
  await returnToClientList(page);
};

const recoverWorkerPage = async (
  context: BrowserContext,
  currentPage: Page,
): Promise<Page> => {
  let page = currentPage;
  if (page.isClosed()) page = await context.newPage();
  await returnToClientList(page);
  return page;
};

const ensurePetecIsReady = async (
  page: Page,
): Promise<void> => {
  await page.goto(PETEC_CLINICA_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  let syncButton = page.getByRole("button", {
    name: "סנכרון ידני",
    exact: true,
  });
  if (!(await syncButton.isVisible().catch(() => false))) {
    await page.bringToFront();
    console.log(
      "Log in to local PETEC in the browser; the scan will continue automatically...",
    );
    syncButton = page.getByRole("button", { name: "סנכרון ידני", exact: true });
  }
  await syncButton.waitFor({
    state: "visible",
    timeout: PETEC_LOGIN_TIMEOUT_MS,
  });
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
  const errorAlert = page.locator(".MuiAlert-standardError").first();
  await Promise.race([
    success.waitFor({ state: "visible", timeout: SYNC_TIMEOUT_MS }),
    errorAlert
      .waitFor({ state: "visible", timeout: SYNC_TIMEOUT_MS })
      .then(async () => {
        throw new Error(
          `PETEC sync failed: ${normalizeText(await errorAlert.innerText())}`,
        );
      }),
  ]);
  return normalizeText(await success.innerText());
};

const createSyncQueue = (petecPage: Page) => {
  let queue: Promise<void> = Promise.resolve();
  return async (workerName: string, clientCount: number): Promise<void> => {
    const task = queue.then(async () => {
      console.log(
        `[${workerName}] Synchronizing PETEC after ${clientCount} clients...`,
      );
      console.log(`[${workerName}] ${await runPetecManualSync(petecPage)}`);
    });
    queue = task.catch(() => undefined);
    return task;
  };
};

const runWorker = async (
  workerName: string,
  firstNumber: number,
  context: BrowserContext,
  initialPage: Page,
  requestSync: (workerName: string, clientCount: number) => Promise<void>,
): Promise<WorkerResult> => {
  let page = initialPage;
  let opened = 0;
  let skipped = 0;
  let openedSinceSync = 0;

  for (
    let candidate = firstNumber;
    candidate <= CLIENT_NUMBER_END;
    candidate += 2
  ) {
    const clientNumber = String(candidate);
    try {
      if (!(await searchForExactClient(page, clientNumber))) {
        skipped += 1;
        console.log(`[${workerName}:${clientNumber}] No result; skipped.`);
        continue;
      }
      await openClientAndReturn(page, clientNumber);
      opened += 1;
      openedSinceSync += 1;
      console.log(`[${workerName}:${clientNumber}] Opened (${opened} total).`);
    } catch (error) {
      skipped += 1;
      console.error(
        `[${workerName}:${clientNumber}] Failed; continuing: ${error instanceof Error ? error.message : String(error)}`,
      );
      try {
        page = await recoverWorkerPage(context, page);
      } catch (recoveryError) {
        console.error(
          `[${workerName}] Page recovery failed; retrying with a new page: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
        );
        page = await context.newPage();
        await returnToClientList(page);
      }
      continue;
    }

    if (openedSinceSync === SUCCESSFUL_CLIENTS_PER_WORKER_SYNC) {
      await requestSync(workerName, openedSinceSync);
      openedSinceSync = 0;
      await page.bringToFront();
    }
  }

  if (openedSinceSync > 0) {
    await requestSync(workerName, openedSinceSync);
  }
  return { opened, skipped };
};

const main = async (): Promise<void> => {
  if (!ENV.clinicUsername || !ENV.clinicPassword) {
    throw new Error("CLINIC_USERNAME and CLINIC_PASSWORD are required");
  }
  if (
    !Number.isInteger(CLIENT_NUMBER_START) ||
    !Number.isInteger(CLIENT_NUMBER_END) ||
    CLIENT_NUMBER_START < 1 ||
    CLIENT_NUMBER_END < CLIENT_NUMBER_START
  ) {
    throw new Error("The client-number range is invalid");
  }

  const browser = await chromium.launch({ headless: false });
  const petecContext = await browser.newContext();
  const oddContext = await browser.newContext();
  const evenContext = await browser.newContext();
  const petecPage = await petecContext.newPage();
  const oddPage = await oddContext.newPage();
  const evenPage = await evenContext.newPage();
  try {
    await ensurePetecIsReady(petecPage);
    console.log("Starting isolated odd and even Clinica workers...");
    await Promise.all([
      openClinicaClientList(oddPage),
      openClinicaClientList(evenPage),
    ]);

    const requestSync = createSyncQueue(petecPage);
    const firstOdd =
      CLIENT_NUMBER_START % 2 === 1
        ? CLIENT_NUMBER_START
        : CLIENT_NUMBER_START + 1;
    const firstEven =
      CLIENT_NUMBER_START % 2 === 0
        ? CLIENT_NUMBER_START
        : CLIENT_NUMBER_START + 1;
    const [oddResult, evenResult] = await Promise.all([
      runWorker("odd", firstOdd, oddContext, oddPage, requestSync),
      runWorker("even", firstEven, evenContext, evenPage, requestSync),
    ]);

    console.log(
      `Finished ${CLIENT_NUMBER_START}-${CLIENT_NUMBER_END}: ` +
        `${oddResult.opened + evenResult.opened} opened, ` +
        `${oddResult.skipped + evenResult.skipped} skipped.`,
    );
  } finally {
    await Promise.all([
      oddContext.close().catch(() => undefined),
      evenContext.close().catch(() => undefined),
      petecContext.close().catch(() => undefined),
    ]);
    await browser.close().catch(() => undefined);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
