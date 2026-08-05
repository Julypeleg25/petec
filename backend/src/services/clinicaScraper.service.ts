import { Browser, chromium, Page } from "playwright";
import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import {
  ClinicaMedicalRecordDto,
  ClinicaVisitTableDto,
  ImportedClinicaAggregate,
} from "../utils/clinica-query.types.js";

interface LoginCredentials {
  username: string;
  password: string;
}

interface ExtractedClientRow {
  ownerName: string;
  ownerPhone: string;
  petNames: string[];
  externalPatientId?: string;
  externalPatientIds: string[];
  detailPatientId?: string;

  gender?: string;
  breed?: string;
  species?: string;
  color?: string;
  weightKg?: number;
  ageYears?: number;
  ageMonths?: number;
  insurance?: string;
  treatingDoctor?: string;
  referringDoctor?: string;
}

type ExtractedPatientDetails = Partial<
  Pick<
    ExtractedClientRow,
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

interface ClinicaDirectoryClientPayload {
  recordID?: number | string;
  UserID?: string;
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Phone2?: string | null;
  CellPhone?: string;
  CellPhone2?: string;
  CellPhone3?: string;
  TreatingTherapist?: string;
  Reffer?: string;
}

interface ClinicaDirectoryPetPayload {
  PetID?: number | string;
  Name?: string;
  Type?: string;
  Breed?: string;
  Sex?: number;
  Weight?: number;
  DateBirth?: string;
  Color?: string;
  InsuranceName?: string;
  YearPlan?: string;
  InsCust?: number;
}

const CLINICA_PET_DIRECTORY_WORKERS = 10;

export class ClinicaScraperService {
  private browser: Browser | null = null;

  init = async (): Promise<void> => {
    if (this.browser?.isConnected()) {
      return;
    }

    logger.info("Launching Clinica scraper browser", {
      module: "clinica",
      event: "clinica_scraper_browser_launch_started",
    });

    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    logger.info("Clinica scraper browser launched", {
      module: "clinica",
      event: "clinica_scraper_browser_launch_finished",
    });
  };

  close = async (): Promise<void> => {
    const browser = this.browser;
    this.browser = null;
    await browser?.close().catch(() => undefined);
  };

  getBrowser = (): Browser => {
    if (!this.browser) {
      throw new Error("Browser is not initialized");
    }

    return this.browser;
  };

  login = async (
    page: Page,
    credentials: LoginCredentials,
  ): Promise<void> => {
    const loginUrl =
      `${ENV.clinicaBaseUrl}/login.aspx?ReturnUrl=%2f`;

    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector("#ctl00_MainContent_Login1_UserName", {
      state: "visible",
      timeout: 30000,
    });

    await page.fill(
      "#ctl00_MainContent_Login1_UserName",
      credentials.username,
    );

    await page.fill(
      "#ctl00_MainContent_Login1_Password",
      credentials.password,
    );

    await Promise.all([
      page.waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: 30000,
      }).catch(() => undefined),
      page.click("#ctl00_MainContent_Login1_LoginButton"),
    ]);

    if (
      page.url().toLowerCase().includes("login") ||
      await page.locator("#ctl00_MainContent_Login1_LoginButton").isVisible().catch(() => false)
    ) {
      throw new Error("Login failed");
    }
  };

  selectClinicCenterIfNeeded = async (
    page: Page,
  ): Promise<void> => {
    const centerButton =
      page.locator("#ctl00_MainContent_Button1");

    if ((await centerButton.count()) === 0) {
      return;
    }

    const isVisible = await centerButton
      .isVisible()
      .catch(() => false);

    if (!isVisible) {
      return;
    }

    await Promise.all([
      page.waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: 30000,
      }).catch(() => undefined),
      centerButton.click(),
    ]);
  };

  openClientsPage = async (
    page: Page,
  ): Promise<void> => {
    await page.goto(
      `${ENV.clinicaBaseUrl}/vetclinic/therapists/patientlistvet.aspx`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      },
    );

    if (page.url().toLowerCase().includes("login")) {
      throw new Error("Clinica session expired while opening the clients page");
    }

    await page.locator("span.listLable").first().waitFor({
      state: "attached",
      timeout: 30000,
    });
  };

  requestClinicaArray = async <T>(
    page: Page,
    method: string,
    data: Record<string, unknown>,
  ): Promise<T[]> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await page.request.post(
          `${ENV.clinicaBaseUrl}/Restricted/dbCalander.asmx/${method}`,
          {
            data,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json; charset=UTF-8",
            },
            timeout: 30000,
          },
        );
        if (!response.ok()) {
          throw new Error(`Clinica ${method} returned HTTP ${response.status()}`);
        }

        const payload = await response.json() as { d?: unknown };
        const value = typeof payload.d === "string"
          ? JSON.parse(payload.d) as unknown
          : payload.d;
        if (!Array.isArray(value)) {
          throw new Error(`Clinica ${method} returned an invalid response`);
        }
        return value as T[];
      } catch (error) {
        lastError = error;
        if (attempt < 2) await page.waitForTimeout(250);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Clinica ${method} request failed`);
  };

  mapDirectoryPetAggregate = (
    client: ClinicaDirectoryClientPayload,
    pet: ClinicaDirectoryPetPayload,
  ): ImportedClinicaAggregate | null => {
    const petName = String(pet.Name ?? "").replace(/\s+/g, " ").trim();
    if (!this.isValidPetName(petName)) return null;

    const ownerName = [client.FirstName, client.LastName]
      .map((value) => String(value ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
    const ownerPhone = this.extractPhone([
      client.CellPhone ?? "",
      client.Phone ?? "",
      client.Phone2 ?? "",
      client.CellPhone2 ?? "",
      client.CellPhone3 ?? "",
    ]);
    const weight = Number(pet.Weight);
    const age = this.extractAgeFromClinicaDate(String(pet.DateBirth ?? ""));
    const externalPatientId = String(pet.PetID ?? "").trim();

    return {
      patient: {
        externalClientId: String(client.recordID ?? "").trim() || undefined,
        externalPatientId:
          externalPatientId && externalPatientId !== "0"
            ? externalPatientId
            : undefined,
        name: petName,
        owner: { name: ownerName, phone: ownerPhone },
        gender:
          pet.Sex === 0
            ? "\u05d6\u05db\u05e8"
            : pet.Sex === 1
              ? "\u05e0\u05e7\u05d1\u05d4"
              : undefined,
        breed: String(pet.Breed ?? "").trim() || undefined,
        species: String(pet.Type ?? "").trim() || undefined,
        color: String(pet.Color ?? "").trim() || undefined,
        weightKg: Number.isFinite(weight) && weight > 0 ? weight : undefined,
        ageYears: age.ageYears,
        ageMonths: age.ageMonths,
        insurance:
          String(pet.InsuranceName ?? "").trim() ||
          (pet.InsCust
            ? String(pet.YearPlan ?? "").trim() || undefined
            : undefined),
        treatingDoctor:
          String(client.TreatingTherapist ?? "").trim() || undefined,
        referringDoctor: String(client.Reffer ?? "").trim() || undefined,
      },
      medicalRecords: [],
    };
  };

  mapDirectoryClientAggregate = (
    client: ClinicaDirectoryClientPayload,
  ): ImportedClinicaAggregate | null => {
    const ownerName = [client.FirstName, client.LastName]
      .map((value) => String(value ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
    const externalClientId = String(client.recordID ?? "").trim();
    const ownerPhone = this.extractPhone([
      client.CellPhone ?? "",
      client.Phone ?? "",
      client.Phone2 ?? "",
      client.CellPhone2 ?? "",
      client.CellPhone3 ?? "",
    ]);

    if (!ownerName || (!externalClientId && !ownerPhone)) return null;

    return {
      patient: {
        externalClientId: externalClientId || undefined,
        name: "",
        owner: { name: ownerName, phone: ownerPhone },
        treatingDoctor: String(client.TreatingTherapist ?? "").trim() || undefined,
        referringDoctor: String(client.Reffer ?? "").trim() || undefined,
      },
      medicalRecords: [],
    };
  };

  scrapeClientDirectory = async (
    page: Page,
  ): Promise<ImportedClinicaAggregate[]> => {
    const recentClients = await this.requestClinicaArray<ClinicaDirectoryClientPayload>(
      page,
      "GetLastPatients",
      { move: 0, fromDate: "" },
    );
    const clients = Array.from(
      new Map(
        recentClients
          .map((client) => [
            String(client.UserID || client.recordID || "").trim(),
            client,
          ] as const)
          .filter(([key]) => Boolean(key)),
      ).values(),
    );
    const aggregates: ImportedClinicaAggregate[] = [];
    let nextClientIndex = 0;
    let failedPetLists = 0;
    const workerCount = Math.min(CLINICA_PET_DIRECTORY_WORKERS, clients.length);

    const runWorker = async (): Promise<void> => {
      while (nextClientIndex < clients.length) {
        const client = clients[nextClientIndex++];
        const userId = String(client.UserID ?? "").trim();
        if (!userId) continue;

        let pets: ClinicaDirectoryPetPayload[];
        try {
          pets = await this.requestClinicaArray<ClinicaDirectoryPetPayload>(
            page,
            "GetPetsNames",
            { PatientID: userId },
          );
        } catch (error) {
          failedPetLists += 1;
          logger.warn("Clinica pet directory could not be fetched", {
            module: "clinica",
            event: "clinica_pet_directory_fetch_failed",
            externalClientId: client.recordID,
            error: error instanceof Error ? error.message : String(error),
          });
          continue;
        }

        const clientAggregates = pets.flatMap((pet) => {
          const aggregate = this.mapDirectoryPetAggregate(client, pet);
          return aggregate ? [aggregate] : [];
        });
        if (clientAggregates.length > 0) {
          aggregates.push(...clientAggregates);
        } else {
          const clientOnlyAggregate = this.mapDirectoryClientAggregate(client);
          if (clientOnlyAggregate) aggregates.push(clientOnlyAggregate);
        }
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    logger.info("Clinica directory fetch finished", {
      module: "clinica",
      event: "clinica_directory_fetch_finished",
      clients: clients.length,
      pets: aggregates.length,
      failedPetLists,
    });
    return this.removeDuplicates(aggregates);
  };

  getClientRowsSignature = (rows: ExtractedClientRow[]): string =>
    rows
      .map((row) =>
        [
          row.externalPatientId ?? "",
          row.ownerPhone,
          ...row.petNames.map((name) => this.normalizePatientName(name)),
        ].join("|"),
      )
      .sort()
      .join("\n");

  waitForClientRowsChange = async (
    page: Page,
    previousSignature: string,
    timeoutMs: number,
  ): Promise<ExtractedClientRow[]> => {
    const deadline = Date.now() + timeoutMs;
    let rows = await this.extractClientRows(page);

    while (
      this.getClientRowsSignature(rows) === previousSignature &&
      Date.now() < deadline
    ) {
      await page.waitForTimeout(150);
      rows = await this.extractClientRows(page);
    }

    return rows;
  };

  extractAllClientRows = async (
    page: Page,
  ): Promise<ExtractedClientRow[]> => {
    let currentRows = await this.extractClientRows(page);
    const filter = page.locator("#SelectFilter");

    if (
      (await filter.count()) > 0 &&
      (await filter.inputValue().catch(() => "")) !== "7"
    ) {
      const previousSignature = this.getClientRowsSignature(currentRows);
      await filter.selectOption("7").catch(() => undefined);
      currentRows = await this.waitForClientRowsChange(
        page,
        previousSignature,
        3000,
      );

      if (this.getClientRowsSignature(currentRows) === previousSignature) {
        const refreshButton = page.locator("#button1, #button2").first();
        if ((await refreshButton.count()) > 0) {
          await refreshButton.click().catch(() => undefined);
          currentRows = await this.waitForClientRowsChange(
            page,
            previousSignature,
            10000,
          );
        }
      }
    }

    const allRows: ExtractedClientRow[] = [];
    const seenPages = new Set<string>();

    for (let pageIndex = 0; pageIndex < 500; pageIndex += 1) {
      const pageSignature = this.getClientRowsSignature(currentRows);
      if (!pageSignature || seenPages.has(pageSignature)) {
        break;
      }
      seenPages.add(pageSignature);
      allRows.push(...currentRows);

      const nextButton = page.locator("#button_MoreRecords").first();
      if ((await nextButton.count()) === 0) {
        break;
      }
      const canAdvance = await nextButton
        .evaluate((element) => {
          const control = element as HTMLInputElement;
          const style = window.getComputedStyle(control);
          return !(
            control.disabled ||
            control.getAttribute("aria-disabled") === "true" ||
            style.display === "none" ||
            style.visibility === "hidden"
          );
        })
        .catch(() => false);
      if (!canAdvance) {
        break;
      }

      await nextButton.click().catch(() => undefined);
      const nextRows = await this.waitForClientRowsChange(
        page,
        pageSignature,
        10000,
      );
      const nextSignature = this.getClientRowsSignature(nextRows);
      if (!nextSignature || nextSignature === pageSignature) {
        break;
      }
      currentRows = nextRows;
    }

    return this.removeDuplicateClientRows(allRows);
  };

  searchClientRows = async (
    page: Page,
    query: string,
    searchType: "5" | "10",
    petName?: string,
  ): Promise<ExtractedClientRow[]> => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const searchTypeControl = page.locator("#ctl00_PageName_selectType");
    const searchInput = page.locator("#TextBoxSearch");
    const searchButton = page.locator("#search1");
    if (
      (await searchTypeControl.count()) === 0 ||
      (await searchInput.count()) === 0 ||
      (await searchButton.count()) === 0
    ) {
      return this.extractClientRows(page);
    }

    await searchTypeControl.selectOption(searchType);
    await searchInput.fill(normalizedQuery);
    await searchButton.click();
    await page
      .waitForFunction(
        ({ expected, type }) => {
          const digits = (value: string): string => value.replace(/\D/g, "");
          return Array.from(document.querySelectorAll("tr")).some((row) => {
            const cellTexts = Array.from(row.querySelectorAll("td")).map((cell) =>
              (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
            );
            return type === "5"
              ? cellTexts.some((value) => value === expected)
              : cellTexts.some((value) => digits(value).includes(digits(expected)));
          });
        },
        { expected: normalizedQuery, type: searchType },
        { timeout: 12000 },
      )
      .catch(() => undefined);

    return this.extractClientRows(page, petName);
  };

  scrapeClients = async (
    options: { includeMedicalRecords?: boolean } = {},
  ): Promise<
    ImportedClinicaAggregate[]
  > => {
    const browser = this.getBrowser();

    const context = await browser.newContext();

    const page = await context.newPage();

    try {
      logger.info("Clinica scraper login started", {
        module: "clinica",
        event: "clinica_scraper_login_started",
      });

      await this.login(page, {
        username: ENV.clinicUsername,
        password: ENV.clinicPassword,
      });

      logger.info("Clinica scraper login finished", {
        module: "clinica",
        event: "clinica_scraper_login_finished",
      });

      await this.selectClinicCenterIfNeeded(page);

      logger.info("Clinica scraper opening clients page", {
        module: "clinica",
        event: "clinica_scraper_open_clients_page_started",
      });

      await this.openClientsPage(page);

      logger.info("Clinica scraper extracting client directory", {
        module: "clinica",
        event: "clinica_scraper_extract_rows_started",
      });

      const directoryItems = await this.scrapeClientDirectory(page);

      logger.info("Clinica scraper extracted client directory", {
        module: "clinica",
        event: "clinica_scraper_extract_rows_finished",
        rowsCount: directoryItems.length,
      });

      if (!options.includeMedicalRecords) {
        return directoryItems;
      }

      const clientOnlyItems = directoryItems.filter(({ patient }) => !patient.name);
      const tasks = directoryItems.filter(({ patient }) => Boolean(patient.name)).map(({ patient }) => ({
        petName: patient.name,
        petIndex: 0,
        row: {
          ownerName: patient.owner.name,
          ownerPhone: patient.owner.phone,
          petNames: [patient.name],
          externalPatientId: patient.externalClientId,
          externalPatientIds: patient.externalPatientId
            ? [patient.externalPatientId]
            : [],
          detailPatientId: patient.externalPatientId,
          gender: patient.gender,
          breed: patient.breed,
          species: patient.species,
          color: patient.color,
          weightKg: patient.weightKg,
          ageYears: patient.ageYears,
          ageMonths: patient.ageMonths,
          insurance: patient.insurance,
          treatingDoctor: patient.treatingDoctor,
          referringDoctor: patient.referringDoctor,
        } satisfies ExtractedClientRow,
      }));

      const results: ImportedClinicaAggregate[] = [];
      const workerCount = Math.min(4, tasks.length);
      let nextTaskIndex = 0;
      const authenticatedState = await context.storageState();

      logger.info("Clinica pet worker pool started", {
        module: "clinica",
        event: "clinica_pet_workers_started",
        workerCount,
        taskCount: tasks.length,
      });

      const runWorker = async (workerIndex: number): Promise<void> => {
        const workerContext = await browser.newContext({
          storageState: authenticatedState,
        });
        await workerContext.route("**/*", async (route) => {
          const resourceType = route.request().resourceType();
          if (["image", "media", "font"].includes(resourceType)) {
            await route.abort();
          } else {
            await route.continue();
          }
        });
        const workerPage = await workerContext.newPage();

        try {
          while (nextTaskIndex < tasks.length) {
            const taskIndex = nextTaskIndex++;
            const { row, petName, petIndex } = tasks[taskIndex];
            if (!row.externalPatientIds[petIndex]) {
              await this.openClientsPage(workerPage);
              if (row.externalPatientId) {
                await this.searchClientRows(
                  workerPage,
                  row.externalPatientId,
                  "5",
                  petName,
                );
              }
            }
          const petRow: ExtractedClientRow = {
            ...row,
            petNames: [petName],
            detailPatientId: row.externalPatientIds[petIndex] || undefined,
          };
          let medicalRecords: ClinicaMedicalRecordDto[] = [];

          try {
              medicalRecords = await this.scrapeClientMedicalRecords(workerPage, petRow);
          } catch (error) {
            logger.warn("Clinica patient details could not be scraped", {
              module: "clinica",
              event: "clinica_patient_scrape_failed",
                workerIndex,
              externalPatientId: petRow.externalPatientId,
              ownerPhone: petRow.ownerPhone,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          results.push({
            patient: {
              externalClientId: row.externalPatientId,
              externalPatientId: petRow.detailPatientId,
            
              name: petName,
            
              owner: {
                name: row.ownerName,
                phone: row.ownerPhone,
              },
            
              gender: petRow.gender,
              breed: petRow.breed,
              species: petRow.species,
              color: petRow.color,
              weightKg: petRow.weightKg,
              ageYears: petRow.ageYears,
              ageMonths: petRow.ageMonths,
              insurance: petRow.insurance,
              treatingDoctor: petRow.treatingDoctor,
              referringDoctor: petRow.referringDoctor,
            },

            medicalRecords:
                medicalRecords.filter(
                  (record) => this.normalizePatientName(record.patientName) ===
                    this.normalizePatientName(petName),
                ),
          });
          }
        } finally {
          await workerContext.close().catch(() => undefined);
        }
      };

      await Promise.all(
        Array.from({ length: workerCount }, (_, index) => runWorker(index)),
      );

      logger.info("Clinica pet worker pool finished", {
        module: "clinica",
        event: "clinica_pet_workers_finished",
        importedCount: results.length,
      });

      return this.removeDuplicates([...clientOnlyItems, ...results]);
    } finally {
      await context.close().catch(() => undefined);
    }
  };

  findCasePetInDirectory = async (
    page: Page,
    casePrefix: string,
    petName: string,
  ): Promise<ImportedClinicaAggregate | null> => {
    const clients = await this.requestClinicaArray<ClinicaDirectoryClientPayload>(
      page,
      "SearchByCustNumber",
      { rpd: 0, CustNumber: casePrefix.trim() },
    );
    const client = clients.find(
      (candidate) => String(candidate.recordID ?? "").trim() === casePrefix.trim(),
    ) ?? clients[0];
    const userId = String(client?.UserID ?? "").trim();
    if (!client || !userId) return null;

    const pets = await this.requestClinicaArray<ClinicaDirectoryPetPayload>(
      page,
      "GetPetsNames",
      { PatientID: userId },
    );
    const normalizedPetName = this.normalizePatientName(petName);
    const pet = pets.find(
      (candidate) =>
        this.normalizePatientName(String(candidate.Name ?? "")) === normalizedPetName,
    );
    return pet ? this.mapDirectoryPetAggregate(client, pet) : null;
  };

  scrapeCasePet = async (input: {
    casePrefix: string;
    petName: string;
    ownerPhone?: string;
  }): Promise<ImportedClinicaAggregate | null> => {
    const context = await this.getBrowser().newContext();
    const page = await context.newPage();

    try {
      await this.login(page, {
        username: ENV.clinicUsername,
        password: ENV.clinicPassword,
      });
      await this.selectClinicCenterIfNeeded(page);
      await this.openClientsPage(page);

      try {
        const directoryMatch = await this.findCasePetInDirectory(
          page,
          input.casePrefix,
          input.petName,
        );
        if (directoryMatch) {
          const patient = directoryMatch.patient;
          const authoritativePatientId = patient.externalPatientId;
          // Clinica stores a real numeric PetID, but its medical pages also
          // require the owner selection to establish server-side session state.
          await this.searchClientRows(
            page,
            input.casePrefix,
            "5",
            patient.name,
          );
          const petRow: ExtractedClientRow = {
            ownerName: patient.owner.name,
            ownerPhone: patient.owner.phone,
            petNames: [patient.name],
            externalPatientId: patient.externalClientId,
            externalPatientIds: patient.externalPatientId
              ? [patient.externalPatientId]
              : [],
            detailPatientId: undefined,
            gender: patient.gender,
            breed: patient.breed,
            species: patient.species,
            color: patient.color,
            weightKg: patient.weightKg,
            ageYears: patient.ageYears,
            ageMonths: patient.ageMonths,
            insurance: patient.insurance,
            treatingDoctor: patient.treatingDoctor,
            referringDoctor: patient.referringDoctor,
          };
          const medicalRecords = await this.scrapeClientMedicalRecords(page, petRow);
          return {
            patient: {
              ...patient,
              externalPatientId: authoritativePatientId,
              gender: petRow.gender,
              breed: petRow.breed,
              species: petRow.species,
              color: petRow.color,
              weightKg: petRow.weightKg,
              ageYears: petRow.ageYears,
              ageMonths: petRow.ageMonths,
              insurance: petRow.insurance,
              treatingDoctor: petRow.treatingDoctor,
              referringDoctor: petRow.referringDoctor,
            },
            medicalRecords,
          };
        }
      } catch (error) {
        logger.warn("Clinica exact case directory lookup failed", {
          module: "clinica",
          event: "clinica_case_directory_lookup_failed",
          casePrefix: input.casePrefix,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const normalizedName = this.normalizePatientName(input.petName);
      const normalizedPhone = input.ownerPhone?.replace(/\D/g, "") ?? "";
      const normalizedPrefix = input.casePrefix.trim();
      const findMatchingRow = (
        rows: ExtractedClientRow[],
      ): ExtractedClientRow | undefined => rows.find((candidate) => {
        const hasPet = candidate.petNames.some(
          (name) => this.normalizePatientName(name) === normalizedName,
        );
        if (!hasPet) return false;
        if (candidate.externalPatientId?.trim() === normalizedPrefix) return true;
        return Boolean(
          normalizedPhone &&
          candidate.ownerPhone.replace(/\D/g, "") === normalizedPhone,
        );
      });
      let rows = await this.searchClientRows(
        page,
        normalizedPrefix,
        "5",
        input.petName,
      );
      let row = findMatchingRow(rows);
      if (!row && normalizedPhone) {
        await this.openClientsPage(page);
        rows = await this.searchClientRows(
          page,
          normalizedPhone,
          "10",
          input.petName,
        );
        row = findMatchingRow(rows);
      }
      if (!row) return null;

      const petIndex = row.petNames.findIndex(
        (name) => this.normalizePatientName(name) === normalizedName,
      );
      if (petIndex < 0) return null;
      const petName = row.petNames[petIndex];
      const petRow: ExtractedClientRow = {
        ...row,
        petNames: [petName],
        detailPatientId: row.externalPatientIds[petIndex] || undefined,
      };
      const medicalRecords = await this.scrapeClientMedicalRecords(page, petRow);

      return {
        patient: {
          externalClientId: row.externalPatientId,
          externalPatientId: petRow.detailPatientId,
          name: petName,
          owner: { name: row.ownerName, phone: row.ownerPhone },
          gender: petRow.gender,
          breed: petRow.breed,
          species: petRow.species,
          color: petRow.color,
          weightKg: petRow.weightKg,
          ageYears: petRow.ageYears,
          ageMonths: petRow.ageMonths,
          insurance: petRow.insurance,
          treatingDoctor: petRow.treatingDoctor,
          referringDoctor: petRow.referringDoctor,
        },
        medicalRecords: medicalRecords.filter(
          (record) => this.normalizePatientName(record.patientName) === normalizedName,
        ),
      };
    } finally {
      await context.close().catch(() => undefined);
    }
  };

  extractClientRows = async (
    page: Page,
    fallbackPetName?: string,
  ): Promise<ExtractedClientRow[]> => {
    const table = page
      .getByText("שם הלקוח", { exact: true })
      .first()
      .locator("xpath=ancestor::table[1]");

    const rawRows = await table.locator("tr").evaluateAll((rows) =>
      rows.map((row) => {
        const tableRow = row as HTMLTableRowElement;
        const values = Array.from(tableRow.cells).map((cell) =>
          (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
        );
        const petLinks = Array.from(
          tableRow.querySelectorAll<HTMLElement>(
            'a[href*="petid=" i], [data-petid], [onclick*="petid" i]',
          ),
        )
          .map((element) => {
            const source = [
              element.getAttribute("href"),
              element.getAttribute("onclick"),
              element.getAttribute("data-petid"),
            ]
              .filter(Boolean)
              .join(" ");
            const id =
              source.match(/[?&]petid=([^&#'"\s)]+)/i)?.[1] ??
              element.getAttribute("data-petid") ??
              "";

            return {
              id: id ? decodeURIComponent(id).trim() : "",
              text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
            };
          })
          .filter((link) => link.id);

        return { values, petLinks };
      }),
    );
    const headerRowIndex = rawRows.findIndex((row) =>
      row.values.some((value) => value.includes("שם הלקוח")),
    );
    const headerValues = rawRows[Math.max(headerRowIndex, 0)]?.values ?? [];
    const findColumnIndex = (label: string): number =>
      headerValues.findIndex((header) => header === label || header.includes(label));
    const clientNumberIndex = findColumnIndex("מס' לקוח");
    const clientNameIndex = findColumnIndex("שם הלקוח");
    const homePhoneIndex = findColumnIndex("טלפון בית");
    const mobilePhoneIndex = findColumnIndex("טלפון נייד");

    const clients: ExtractedClientRow[] = [];

    for (const rawRow of rawRows.slice(Math.max(headerRowIndex + 1, 1))) {
      const rowValues = rawRow.values;
      if (rowValues.length < 3) {
        continue;
      }
      const values = rowValues.filter(Boolean);

      const phone = this.extractPhone([
        rowValues[mobilePhoneIndex] ?? "",
        rowValues[homePhoneIndex] ?? "",
        ...values,
      ]);

      const clientNameWithPets = rowValues[clientNameIndex]?.trim() ||
        this.extractClientNameWithPets(values);

      const externalPatientId = rowValues[clientNumberIndex]?.trim() ||
        this.extractClientNumber(values);

      if (!clientNameWithPets || (!externalPatientId && !phone)) {
        continue;
      }

      const { ownerName, petNames: parsedPetNames } =
        this.extractOwnerAndPetNames(clientNameWithPets);

      const petNames = parsedPetNames.length > 0
        ? parsedPetNames
        : fallbackPetName
          ? [fallbackPetName]
          : [];
      const validPetNames = petNames.filter(
        (name) => this.isValidPetName(name),
      );

      const usedPetIds = new Set<string>();
      const externalPatientIds = validPetNames.map((petName, index) => {
        const normalizedPetName = this.normalizePatientName(petName);
        const exactNamedLink = rawRow.petLinks.find(
          (link) =>
            !usedPetIds.has(link.id) &&
            this.normalizePatientName(link.text) === normalizedPetName,
        );
        const partialNamedLink = rawRow.petLinks.find(
          (link) =>
            !usedPetIds.has(link.id) &&
            this.normalizePatientName(link.text).split(" ").includes(normalizedPetName),
        );
        const fallbackLink = rawRow.petLinks.find(
          (link) => !usedPetIds.has(link.id),
        );
        const match =
          exactNamedLink ?? partialNamedLink ?? fallbackLink ?? rawRow.petLinks[index];
        if (match?.id) usedPetIds.add(match.id);
        return match?.id ?? "";
      });

      if (validPetNames.length === 0) {
        continue;
      }

      clients.push({
        ownerName,
        ownerPhone: phone,
        petNames: validPetNames,
        externalPatientId,
        externalPatientIds,
        detailPatientId: externalPatientIds[0] || undefined,
      });
    }

    return this.removeDuplicateClientRows(clients);
  };

  openPetFromClientsPage = async (
    page: Page,
    row: ExtractedClientRow,
  ): Promise<void> => {
    const petName = row.petNames[0]?.trim() ?? "";
    if (!petName) {
      throw new Error("Cannot open a Clinica patient without a pet name");
    }

    const escapeRegExp = (value: string): string =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const petNamePattern = escapeRegExp(petName);
    const petLabelPattern = new RegExp(`^\\s*\\+\\s*${petNamePattern}\\s*$`, "i");
    const plainPetLabelPattern = new RegExp(`^\\s*${petNamePattern}\\s*$`, "i");
    const petLabelLocator = page
      .locator("span.listLable")
      .filter({ hasText: petLabelPattern });
    const plainPetLabelLocator = page
      .locator("span.listLable")
      .filter({ hasText: plainPetLabelPattern });
    const anyPetLabel =
      (await petLabelLocator.count()) > 0 ? petLabelLocator : plainPetLabelLocator;
    const externalClientId = row.externalPatientId?.trim() ?? "";
    const normalizedPhone = row.ownerPhone.replace(/\D/g, "");
    let clientRow = page.locator("tr").filter({ has: anyPetLabel }).first();

    if (externalClientId) {
      const clientIdPattern = new RegExp(
        `^\\s*${escapeRegExp(externalClientId)}\\s*$`,
      );
      const clientIdCell = page
        .locator("td")
        .filter({ hasText: clientIdPattern })
        .first();
      if ((await clientIdCell.count()) > 0) {
        clientRow = clientIdCell.locator("xpath=ancestor::tr[1]");
      }
    } else if ((await clientRow.count()) === 0 && normalizedPhone) {
      const phoneCell = page
        .locator("td")
        .filter({ hasText: new RegExp(escapeRegExp(normalizedPhone)) })
        .first();
      if ((await phoneCell.count()) > 0) {
        clientRow = phoneCell.locator("xpath=ancestor::tr[1]");
      }
    }
    if ((await clientRow.count()) === 0 && row.ownerName.trim()) {
      const ownerPattern = new RegExp(
        `^\\s*${escapeRegExp(row.ownerName.trim())}\\s*$`,
        "i",
      );
      const ownerLabel = page
        .locator("span.listLable")
        .filter({ hasText: ownerPattern })
        .first();
      if ((await ownerLabel.count()) > 0) {
        clientRow = ownerLabel.locator("xpath=ancestor::tr[1]");
      }
    }

    if ((await clientRow.count()) === 0) {
      throw new Error(
        `Clinica client row was not found for pet "${petName}"`,
      );
    }

    let targetLabel = clientRow
      .locator("span.listLable")
      .filter({ hasText: petLabelPattern })
      .first();
    if ((await targetLabel.count()) === 0) {
      targetLabel = clientRow
        .locator("span.listLable")
        .filter({ hasText: plainPetLabelPattern })
        .first();
    }
    if ((await targetLabel.count()) === 0) {
      targetLabel = clientRow.locator("span.listLable").nth(1);
    }
    if ((await targetLabel.count()) === 0) {
      throw new Error(`Clinica patient selector was not found for "${petName}"`);
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
      targetLabel.click(),
    ]);
    await page.locator("#TextBoxPetName").waitFor({
      state: "visible",
      timeout: 15000,
    });
    await this.selectPetOnPatientPage(page, petName);
    row.detailPatientId = await this.extractOpenedPatientId(page) ?? undefined;
  };

  selectPetOnPatientPage = async (
    page: Page,
    petName: string,
  ): Promise<void> => {
    const normalizedTarget = this.normalizePatientName(petName);
    const petNameControl = page.locator("#TextBoxPetName");
    const currentName = await petNameControl.inputValue().catch(() => "");
    if (this.normalizePatientName(currentName) === normalizedTarget) return;

    const petSelect = page.locator(
      '#SelectBoxName, #SelectBoxPetName, select[id*="PetName" i], select[name*="PetName" i]',
    ).first();
    if ((await petSelect.count()) === 0) return;
    const options = await petSelect.locator("option").evaluateAll((elements) =>
      elements.map((element) => ({
        label: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
        value: (element as HTMLOptionElement).value,
      })),
    );
    const selectedOption = options.find((option) => {
      const optionPetName = option.label.split(/\s+-\s+/)[0] ?? "";
      return this.normalizePatientName(optionPetName) === normalizedTarget;
    });
    if (!selectedOption) return;

    await petSelect.selectOption(selectedOption.value);
    await page.waitForFunction(
      (expected) =>
        document.querySelector<HTMLInputElement>("#TextBoxPetName")
          ?.value.trim() === expected,
      petName.trim(),
      { timeout: 30000 },
    );
  };

  extractOpenedPatientId = async (page: Page): Promise<string> => {
    const urlPatientId = new URL(page.url()).searchParams.get("petid")?.trim();
    if (urlPatientId) return urlPatientId;

    return page
      .locator(
        'input[type="hidden"][id*="petid" i], input[type="hidden"][name*="petid" i], [data-petid]',
      )
      .evaluateAll((elements) =>
        elements
          .map((element) =>
            element.getAttribute("data-petid") ||
            (element instanceof HTMLInputElement ? element.value : ""),
          )
          .map((value) => value.trim())
          .find(Boolean) ?? "",
      )
      .catch(() => "");
  };

  scrapeClientMedicalRecords = async (
    page: Page,
    row: ExtractedClientRow,
  ): Promise<ClinicaMedicalRecordDto[]> => {
    const records: ClinicaMedicalRecordDto[] = [];

    try {
      let shouldFindPetByName = !row.detailPatientId;
      if (row.detailPatientId) {
        await page.goto(
          `${ENV.clinicaBaseUrl}/vetclinic/PatientsA/vet/registerp3vet.aspx?action=showform&petid=${encodeURIComponent(row.detailPatientId)}`,
          { waitUntil: "domcontentloaded", timeout: 60000 },
        );
        if (page.url().toLowerCase().includes("login")) {
          throw new Error("Clinica session expired while opening patient details");
        }
        await page.locator("#TextBoxPetName").waitFor({
          state: "attached",
          timeout: 15000,
        });

        const requestedPetName = row.petNames[0]?.trim() ?? "";
        const loadedPetName = await page
          .locator("#TextBoxPetName")
          .inputValue()
          .catch(() => "");
        if (
          requestedPetName &&
          this.normalizePatientName(loadedPetName) !==
          this.normalizePatientName(requestedPetName)
        ) {
          logger.warn("Clinica pet id opened a different patient; falling back to name", {
            module: "clinica",
            event: "clinica_pet_id_name_mismatch",
            requestedPetName,
            loadedPetName,
            externalPatientId: row.detailPatientId,
          });
          shouldFindPetByName = true;
        }
      }

      if (shouldFindPetByName) {
        if (!page.url().toLowerCase().includes("patientlistvet")) {
          await this.openClientsPage(page);
        }

        await this.openPetFromClientsPage(page, row);
      }

      let selectedPetName = await page
        .locator("#TextBoxPetName")
        .inputValue()
        .catch(() => "");
      const targetPetName = row.petNames[0] ?? "";
      if (
        targetPetName &&
        this.normalizePatientName(selectedPetName) !==
          this.normalizePatientName(targetPetName)
      ) {
        await this.selectPetOnPatientPage(page, targetPetName);
        selectedPetName = await page
          .locator("#TextBoxPetName")
          .inputValue()
          .catch(() => "");
      }
      if (
        !targetPetName ||
        this.normalizePatientName(selectedPetName) !==
          this.normalizePatientName(targetPetName)
      ) {
        throw new Error(
          `Clinica opened a different pet (expected "${targetPetName}", got "${selectedPetName}")`,
        );
      }

      this.mergePatientDetails(
        row,
        await this.extractPatientDetailsFromPage(page),
      );

      const tabs = [
        {
          selector: '#tab_Third, [id$="tab_Third"], [id*="Third"][onclick*="myPatientVet"]',
          type: "visitDetails",
        },

        {
          selector: '[id="tab_Second"][onclick*="myPatientVet"]',
          type: "patientDetails",
        },

        {
          selector: '[id="tab_Eighth"][onclick*="myPatientVet"]',
          type: "vaccinations",
        },

        {
          selector: '[id="tab_Pres"][onclick*="myPatientVet"]',
          type: "prescriptions",
        },

        {
          selector: '#tab_Sixth, [id$="tab_Sixth"], [id*="Sixth"][onclick*="myPatientVet"], [id="tab_LinkedDocs"][onclick*="myPatientVet"]',
          type: "linkedDocuments",
        },
      ];

      for (const tab of tabs) {
        let tabPage: Page | null = null;
        try {
          const tabElement =
            page.locator(tab.selector);

          if ((await tabElement.count()) === 0) {
            continue;
          }

          tabPage = await this.openMedicalTab(page, tabElement.first());
          await tabPage.locator("body").waitFor({
            state: "attached",
            timeout: 15000,
          });

          const visitTable =
            tab.type === "visitDetails"
              ? await this.extractVisitTable(tabPage)
              : undefined;
          const documentLinks =
            tab.type === "linkedDocuments"
              ? await this.extractDocumentLinks(tabPage)
              : [];
          const rawText = [
            await this.readMedicalPageText(tabPage),
            ...documentLinks,
          ]
            .filter(Boolean)
            .join("\n");
          const tableText = visitTable
            ? [visitTable.headers, ...visitTable.rows]
                .flat()
                .filter(Boolean)
                .join("\n")
            : "";
          const cleanText = this.cleanMedicalText(rawText || tableText);

          if (tab.type === "patientDetails") {
            this.mergePatientDetails(
              row,
              this.extractPatientDetails(rawText),
            );
          }

          if (!cleanText && !visitTable) {
            continue;
          }

          for (const petName of row.petNames) {
            records.push({
              patientName: petName,
              ownerName: row.ownerName,
              ownerPhone: row.ownerPhone,
              recordType: tab.type,
              rawText: cleanText || tableText,
              table: visitTable,
              syncedAt: new Date(),
            });
          }
        } catch (error) {
          logger.warn("Clinica medical tab could not be scraped", {
            module: "clinica",
            event: "clinica_medical_tab_scrape_failed",
            tab: tab.type,
            externalPatientId: row.externalPatientId,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          if (tabPage && tabPage !== page) {
            await tabPage.close().catch(() => undefined);
          } else if (tabPage === page) {
            const currentPetName = await page
              .locator("#TextBoxPetName")
              .inputValue()
              .catch(() => "");
            if (
              this.normalizePatientName(currentPetName) !==
              this.normalizePatientName(targetPetName)
            ) {
              await this.openClientsPage(page).catch(() => undefined);
              await this.openPetFromClientsPage(page, row).catch(() => undefined);
            }
          }
        }
      }

      return records;
    } catch (error) {
      logger.warn("Clinica patient could not be scraped", {
        module: "clinica",
        event: "clinica_patient_scrape_failed",
        externalPatientId: row.detailPatientId,
        externalClientId: row.externalPatientId,
        petName: row.petNames[0],
        error: error instanceof Error ? error.message : String(error),
      });
      return records;
    }
  };

  normalizePatientName = (value: string): string =>
    value
      .normalize("NFKD")
      .replace(/[\u0591-\u05c7]/g, "")
      .replace(/["'׳״`.,/\\()[\]{}_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("he-IL");

  openMedicalTab = async (
    page: Page,
    tabElement: ReturnType<Page["locator"]>,
  ): Promise<Page> => {
    const [href, onclick] = await Promise.all([
      tabElement.getAttribute("href"),
      tabElement.getAttribute("onclick"),
    ]);
    const explicitTarget = [href, onclick]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/&amp;/g, "&"))
      .map((value) =>
        value.match(/(?:https?:\/\/|\/|\.\.\/|\.\/)?[^'"()\s;]*myPatientVet[^'"()\s;]*\.aspx[^'"()\s;]*/i)?.[0],
      )
      .find(Boolean);

    if (explicitTarget) {
      const tabPage = await page.context().newPage();
      await tabPage.goto(new URL(explicitTarget, page.url()).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      return tabPage;
    }

    const popupPromise = page
      .waitForEvent("popup", { timeout: 2500 })
      .catch(() => null);
    const navigationPromise = page
      .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 2500 })
      .then(() => null)
      .catch(() => null);
    await tabElement.evaluate((element) => {
      (element as HTMLElement).click();
    });
    const popup = await Promise.race([
      popupPromise,
      navigationPromise,
      page.waitForTimeout(2500).then(() => null),
    ]);
    if (popup) {
      await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
      return popup;
    }

    return page;
  };

  readMedicalPageText = async (page: Page): Promise<string> => {
    const frameTexts = await Promise.all(
      page.frames().map(async (frame) => {
        const body = frame.locator("body");
        await body.waitFor({ state: "attached", timeout: 5000 }).catch(() => undefined);
        return body.innerText().catch(() => "");
      }),
    );
    return frameTexts.filter(Boolean).join("\n");
  };

  extractDocumentLinks = async (page: Page): Promise<string[]> => {
    const linkGroups = await Promise.all(
      page.frames().map((frame) =>
        frame
          .locator("a[href]")
          .evaluateAll((anchors) =>
            anchors.map((anchor) => {
              const element = anchor as HTMLAnchorElement;
              const table = element.closest("table");
              return {
                href: element.href,
                label: (element.innerText || element.textContent || "")
                  .replace(/\s+/g, " ")
                  .trim(),
                target: element.target,
                inGrid: Boolean(
                  table && /gridview/i.test(`${table.id} ${table.className}`),
                ),
              };
            }),
          )
          .catch(() => []),
      ),
    );
    const seen = new Set<string>();

    return linkGroups
      .flat()
      .filter(({ href, target, inGrid }) => {
        if (!/^https?:\/\//i.test(href) || seen.has(href)) return false;
        const looksLikeDocument =
          /(?:download|document|attachment|linked|upload|showfile|\.pdf(?:$|[?#])|\.docx?(?:$|[?#])|\.xlsx?(?:$|[?#])|\.jpe?g(?:$|[?#])|\.png(?:$|[?#]))/i.test(
            href,
          );
        if (!inGrid && target !== "_blank" && !looksLikeDocument) return false;
        seen.add(href);
        return true;
      })
      .map(({ label, href }) => `${label || "מסמך"}: ${href}`);
  };

  scrapePetMedicalRecords = async (input: {
    externalClientId?: string;
    externalPatientId?: string;
    ownerName: string;
    ownerPhone: string;
    petName: string;
  }): Promise<{
    externalPatientId?: string;
    records: ClinicaMedicalRecordDto[];
    details: ExtractedPatientDetails;
  }> => {
    const context = await this.getBrowser().newContext();
    const page = await context.newPage();

    try {
      await this.login(page, {
        username: ENV.clinicUsername,
        password: ENV.clinicPassword,
      });
      await this.selectClinicCenterIfNeeded(page);

      const useClientSessionLookup = Boolean(
        input.externalClientId || input.ownerPhone,
      );
      if (useClientSessionLookup) {
        await this.openClientsPage(page);
        if (input.externalClientId) {
          await this.searchClientRows(
            page,
            input.externalClientId,
            "5",
            input.petName,
          );
        } else if (input.ownerPhone) {
          await this.searchClientRows(
            page,
            input.ownerPhone,
            "10",
            input.petName,
          );
        }
      }

      const row: ExtractedClientRow = {
        ownerName: input.ownerName,
        ownerPhone: input.ownerPhone,
        petNames: [input.petName],
        externalPatientId: input.externalClientId,
        externalPatientIds: input.externalPatientId ? [input.externalPatientId] : [],
        detailPatientId: useClientSessionLookup
          ? undefined
          : input.externalPatientId,
      };
      const records = await this.scrapeClientMedicalRecords(page, row);
      return {
        externalPatientId: input.externalPatientId ?? row.detailPatientId,
        records,
        details: {
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
        },
      };
    } finally {
      await context.close().catch(() => undefined);
    }
  };

  extractVisitTable = async (
    page: Page,
  ): Promise<ClinicaVisitTableDto | undefined> => {
    type VisitGridCandidate = ClinicaVisitTableDto & { score: number };
    const collectCandidates = async (): Promise<VisitGridCandidate[]> => {
      const candidates: VisitGridCandidate[] = [];

      for (const frame of page.frames()) {
        const tables = frame.locator(
          "table.GridView4, table[id*='GridView'], table[class*='GridView']",
        );
        const frameCandidates = await tables
          .evaluateAll((elements) =>
            elements.map((element) => {
              const table = element as HTMLTableElement;
              const parsedRows = Array.from(table.rows).map((row) => {
                const cells = Array.from(row.cells).flatMap((cell) => {
                  const checkboxes = Array.from(
                    cell.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
                  );
                  let marpetCheckbox = checkboxes.find((input) => {
                    const associatedLabel = Array.from(
                      cell.querySelectorAll<HTMLLabelElement>("label"),
                    ).find((label) => label.htmlFor && label.htmlFor === input.id);
                    const descriptor = [
                      input.id,
                      input.name,
                      input.title,
                      input.getAttribute("aria-label"),
                      associatedLabel?.textContent,
                      input.closest("label")?.textContent,
                    ].join(" ");
                    return /(?:marpet|report|rabies|\u05db\u05dc\u05d1\u05ea|\u05de\u05e8\u05e4\u05d0)/iu.test(descriptor);
                  });
                  if (
                    !marpetCheckbox &&
                    checkboxes.length === 1 &&
                    /\u05d3\u05d5\u05d5\u05d7 \u05dc\u05de\u05e8\u05e4\u05d0[\u05d4\u05d8]/u.test(cell.textContent ?? "")
                  ) {
                    [marpetCheckbox] = checkboxes;
                  }
                  const marpetStatus = marpetCheckbox
                    ? marpetCheckbox.checked
                      ? "\u05d1\u05d5\u05e6\u05e2"
                      : "\u05dc\u05d0 \u05d1\u05d5\u05e6\u05e2"
                    : undefined;
                  const readableCell = cell.cloneNode(true) as HTMLElement;
                  readableCell
                    .querySelectorAll(
                      "select, option, input, textarea, button, script, style, a, [hidden], [aria-hidden='true']",
                    )
                    .forEach((element) => element.remove());
                  let text = (readableCell.innerText ?? readableCell.textContent ?? "")
                    .split(/\r?\n/)
                    .map((line) => line.replace(/[ \t]+/g, " ").trim())
                    .filter(Boolean)
                    .join("\n");
                  if (marpetStatus) {
                    text = text.replace(
                      /(\u05d3\u05d5\u05d5\u05d7 \u05dc\u05de\u05e8\u05e4\u05d0[\u05d4\u05d8]\s*:)[ \t]*(?=\n|$)/u,
                      `$1 ${marpetStatus}`,
                    );
                  }
                  const documentUrls = Array.from(
                    cell.querySelectorAll<HTMLAnchorElement>("a[href]"),
                  )
                    .map((anchor) => anchor.href)
                    .filter((url) => /^https?:\/\//i.test(url));
                  const content = [
                    text,
                    ...documentUrls.filter((url) => !text.includes(url)),
                  ]
                    .filter(Boolean)
                    .join("\n");

                  return [
                    content,
                    ...Array.from(
                      { length: Math.max(cell.colSpan - 1, 0) },
                      () => "",
                    ),
                  ];
                });

                return {
                  cells,
                  headerCells: Array.from(row.cells).filter(
                    (cell) => cell.tagName === "TH" && cell.textContent?.trim(),
                  ).length,
                  nonEmptyCells: cells.filter(Boolean).length,
                };
              });
              const headerIndexWithTh = parsedRows.findIndex(
                (row) => row.headerCells >= 2 && row.nonEmptyCells >= 2,
              );
              const headerIndex = headerIndexWithTh >= 0
                ? headerIndexWithTh
                : parsedRows.findIndex((row) => row.nonEmptyCells >= 2);
              const headers =
                headerIndex >= 0 ? parsedRows[headerIndex].cells : [];
              const rows = headerIndex >= 0
                ? parsedRows
                    .slice(headerIndex + 1)
                    .filter(
                      (row) =>
                        row.nonEmptyCells >= 2 &&
                        /\b\d{1,2}[./-]\d{1,2}[./-](?:\d{4}|\d{2})(?=\D|$|\d{1,2}:)/.test(
                          row.cells.join(" "),
                        ),
                    )
                    .map((row) => [
                      ...row.cells.slice(0, headers.length),
                      ...Array.from(
                        { length: Math.max(headers.length - row.cells.length, 0) },
                        () => "",
                      ),
                    ])
                : [];
              const headerText = headers.join(" ");
              const identity = `${table.id} ${table.className}`;
              const score =
                (/GridView4/i.test(identity) ? 10000 : 0) +
                (headerText.match(/תאריך|ביקור|רופא|סניף|היסטוריה|ממצאים/g)
                  ?.length ?? 0) *
                  1000 +
                rows.length;

              return { headers, rows, score };
            }),
          )
          .catch(() => []);
        candidates.push(...frameCandidates);
      }

      return candidates;
    };

    const deadline = Date.now() + 5000;
    do {
      const visitGrid = (await collectCandidates())
        .filter((table) => table.headers.length >= 2 && table.rows.length > 0)
        .sort((left, right) => right.score - left.score)[0];
      if (visitGrid) {
        const { headers, rows } = visitGrid;
        return { headers, rows };
      }
      if (Date.now() < deadline) {
        await page.waitForTimeout(200);
      }
    } while (Date.now() < deadline);

    return undefined;
  };

  cleanMedicalText = (text: string): string => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const ignored = [
      "יומן קליניקה",
      "תיקי לקוחות",
      "הגדרות",
      "ניהול",
      "עזרה",
      "דף הבית",
      "יציאה",
    ];

    const cleanedLines = lines.filter(
      (line) =>
        !ignored.some((word) =>
          line.includes(word),
        ),
    );

    return cleanedLines
      .join("\n")
      .slice(0, 8000);
  };

  extractPatientDetailsFromPage = async (
    page: Page,
  ): Promise<ExtractedPatientDetails> => {
    // Clinica renders many hidden forms in the same document. Parsing the whole
    // body mixes their labels with the active pet, so demographics must come
    // from the active patient controls only.
    const parsedDetails: ExtractedPatientDetails = {};
    const [
      gender,
      species,
      breed,
      color,
      insurance,
      treatingDoctor,
      referringDoctor,
      weightText,
      ageText,
      summaryText,
    ] =
      await Promise.all([
        this.readControlValue(
          page,
          '#sex1, #sex2, #TextBoxGender, #SelectGender, #ddlGender, [name*="gender" i], [id*="gender" i], [name="sex" i]',
        ),
        this.readControlValue(page, "#TextBoxType"),
        this.readControlValue(page, "#TextBoxBreed"),
        this.readControlValue(page, "#TextBoxColor"),
        this.readControlValue(page, "#txtInsuranceName"),
        this.readControlValue(page, "#SelectBoxDoctorName, #SelectTreatingTH"),
        this.readControlValue(page, "#TextBoxReffer"),
        this.readControlValue(
          page,
          '#TextBoxWeight, [name*="weight" i], [id^="TextBoxWeight" i]',
        ),
        this.readControlValue(
          page,
          '#age1, #TextBoxAge, #TextBoxBirthDate, [id$="TextBoxDateBirth" i], [name*="birth" i], [id*="birth" i]',
        ),
        this.readControlValue(page, "#TextBoxName"),
      ]);
    const summaryWeight = summaryText.match(
      /(\d+(?:[.,]\d+)?)\s*\u05e7[\u05f3'"\u05f4]?\u05d2/u,
    )?.[1];
    const extractedWeight = weightText
      ? this.extractWeightKg(`${weightText} kg`)
      : summaryWeight
        ? Number(summaryWeight.replace(",", "."))
        : undefined;
    const directWeight =
      extractedWeight !== undefined && extractedWeight > 0
        ? extractedWeight
        : undefined;
    const clinicaAgeMatch = ageText.match(/^(\d+)(?:[.,](\d{1,2}))?$/);
    const clinicaAgeYears = this.toNonNegativeInteger(clinicaAgeMatch?.[1]);
    const clinicaAgeMonths = this.toMonthValue(clinicaAgeMatch?.[2]);
    const directAge = clinicaAgeYears !== undefined
      ? {
          ageYears: clinicaAgeYears,
          ageMonths: clinicaAgeMonths,
        }
      : ageText
        ? this.extractAge(`birth date ${ageText}`)
        : {};

    return {
      ...parsedDetails,
      gender: this.cleanDetailValue(gender) || parsedDetails.gender,
      species: this.cleanDetailValue(species) || parsedDetails.species,
      breed: this.cleanDetailValue(breed) || parsedDetails.breed,
      color: this.cleanDetailValue(color) || parsedDetails.color,
      insurance: this.cleanDetailValue(insurance) || parsedDetails.insurance,
      treatingDoctor:
        this.cleanDetailValue(treatingDoctor) || parsedDetails.treatingDoctor,
      referringDoctor:
        this.cleanDetailValue(referringDoctor) || parsedDetails.referringDoctor,
      weightKg: directWeight ?? parsedDetails.weightKg,
      ageYears: directAge.ageYears ?? parsedDetails.ageYears,
      ageMonths: directAge.ageMonths ?? parsedDetails.ageMonths,
    };
  };

  readControlValue = async (page: Page, selector: string): Promise<string> => {
    const selectors = selector
      .split(",")
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    for (const candidate of selectors) {
      const controls = page.locator(candidate);
      if ((await controls.count()) === 0) continue;

      const value = await controls
        .evaluateAll((elements) => {
          for (const element of elements) {
            if (element instanceof HTMLSelectElement) {
              const selectedValue = (
                element.selectedOptions[0]?.textContent?.trim() ||
                element.value.trim()
              );
              if (selectedValue) return selectedValue;
              continue;
            }
            if (element instanceof HTMLInputElement) {
              if (
                (element.type === "radio" || element.type === "checkbox") &&
                !element.checked
              ) {
                continue;
              }
              if (element.type === "radio" || element.type === "checkbox") {
                const explicitLabel = element.id
                  ? document.querySelector(
                      `label[for="${CSS.escape(element.id)}"]`,
                    )
                  : null;
                const explicitText = explicitLabel?.textContent?.trim();
                if (explicitText) return explicitText;

                const siblingText: string[] = [];
                let sibling = element.nextSibling;
                while (sibling) {
                  if (
                    sibling instanceof HTMLInputElement ||
                    sibling instanceof HTMLSelectElement
                  ) {
                    break;
                  }
                  const text = sibling.textContent
                    ?.replace(/\s+/g, " ")
                    .trim();
                  if (text) siblingText.push(text);
                  sibling = sibling.nextSibling;
                }
                if (siblingText.length > 0) return siblingText.join(" ");

                const parentLabel = element.closest("label");
                const checkedValue =
                  parentLabel?.textContent?.trim() || element.value.trim();
                if (checkedValue) return checkedValue;
                continue;
              }
              const inputValue = element.value.trim();
              if (inputValue) return inputValue;
              continue;
            }
            if (element instanceof HTMLTextAreaElement) {
              const textareaValue = element.value.trim();
              if (textareaValue) return textareaValue;
              continue;
            }
            const textValue = element.textContent?.trim() ?? "";
            if (textValue) return textValue;
          }

          return "";
        })
        .catch(() => "");
      if (value) return value;
    }

    return "";
  };

  mergePatientDetails = (
    target: ExtractedClientRow,
    details: ExtractedPatientDetails,
  ): void => {
    Object.entries(details).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        return;
      }

      const typedKey = key as keyof ExtractedPatientDetails;

      if (target[typedKey] === undefined || target[typedKey] === "") {
        Object.assign(target, {
          [typedKey]: value,
        });
      }
    });
  };

  extractPatientDetails = (
    text: string,
  ): ExtractedPatientDetails => {
    const normalizedText = text
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ");

    return {
      gender: this.extractLabeledText(normalizedText, ["מין"]),
      breed: this.extractLabeledText(normalizedText, ["גזע"]),
      species: this.extractLabeledText(normalizedText, ["סוג חיה", "סוג"]),
      color: this.extractLabeledText(normalizedText, ["צבע"]),
      weightKg: this.extractWeightKg(normalizedText),
      ...this.extractAge(normalizedText),
      insurance: this.extractLabeledText(normalizedText, ["ביטוח"]),
      treatingDoctor: this.extractLabeledText(normalizedText, [
        "רופא מטפל",
        "רופאה מטפלת",
      ]),
      referringDoctor: this.extractLabeledText(normalizedText, [
        "רופא מפנה",
        "רופאה מפנה",
      ]),
    };
  };

  extractLabeledText = (
    text: string,
    labels: string[],
  ): string | undefined => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      for (const label of labels) {
        if (!line.includes(label)) {
          continue;
        }

        const inlineValue = line
          .replace(label, "")
          .replace(/^[:\-\s]+/, "")
          .trim();

        const value =
          inlineValue || lines[index + 1]?.trim() || "";

        const cleanValue = this.cleanDetailValue(value);

        if (cleanValue) {
          return cleanValue;
        }
      }
    }

    return undefined;
  };

  cleanDetailValue = (value: string): string => {
    const cleaned = value
      .replace(/^[:\-\s]+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    if (
      !cleaned ||
      /:$/.test(cleaned) ||
      /^(?:בחר|0|1)$/i.test(cleaned) ||
      /(?:מין\s*:\s*)?זכר\s+נקבה/.test(cleaned)
    ) {
      return "";
    }

    return cleaned;
  };

  extractWeightKg = (text: string): number | undefined => {
    const match =
      text.match(/(?:משקל|weight|wt)[^\d]{0,60}(\d+(?:[.,]\d+)?)/i) ??
      text.match(/(\d+(?:[.,]\d+)?)\s*(?:קילו|קג|ק"ג|ק״ג|kg)/i);

    if (!match?.[1]) {
      return undefined;
    }

    const weight = Number(match[1].replace(",", "."));

    return Number.isFinite(weight) && weight > 0 && weight <= 500
      ? weight
      : undefined;
  };

  extractAge = (
    text: string,
  ): Pick<ExtractedPatientDetails, "ageYears" | "ageMonths"> => {
    const decimalYearsMatch =
      text.match(/(?:גיל|שנים|שנה|years|year)[^\d]{0,80}(\d+(?:[.,]\d+))/i) ??
      text.match(/(\d+(?:[.,]\d+)?)\s*(?:שנים|שנה|years|year)/i);
    const decimalYears = decimalYearsMatch?.[1]
      ? Number(decimalYearsMatch[1].replace(",", "."))
      : undefined;

    if (decimalYears !== undefined && !Number.isInteger(decimalYears)) {
      const ageYears = Math.floor(decimalYears);
      const ageMonths = Math.round((decimalYears - ageYears) * 12);

      return {
        ageYears,
        ageMonths: ageMonths <= 11 ? ageMonths : undefined,
      };
    }

    const combinedAgeMatch =
      text.match(/גיל[^\d]{0,60}(\d+)\s*(?:שנים|שנה)[^\d]{0,30}(\d+)?\s*(?:חודשים|חודש)?/) ??
      text.match(/(\d+)\s*(?:שנים|שנה)[^\d]{0,30}(\d+)?\s*(?:חודשים|חודש)?/);

    const explicitYearsMatch =
      text.match(/(?:גיל\s*\(?שנים\)?|שנים|years|year)[^\d]{0,60}(\d+)/i);

    const explicitMonthsMatch =
      text.match(/(?:גיל\s*\(?חודשים\)?|חודשים|חודש|months|month)[^\d]{0,60}(\d+)/i);

    const birthDateMatch = text.match(
      /(?:תאריך לידה|לידה|birth date|dob)[^\d]{0,40}(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i,
    );

    const ageYears = this.toNonNegativeInteger(
      explicitYearsMatch?.[1] ?? combinedAgeMatch?.[1],
    );
    const rawMonths = this.toNonNegativeInteger(
      explicitMonthsMatch?.[1] ?? combinedAgeMatch?.[2],
    );

    if (ageYears === undefined && rawMonths !== undefined && rawMonths > 11) {
      return {
        ageYears: Math.floor(rawMonths / 12),
        ageMonths: rawMonths % 12,
      };
    }

    const ageMonths =
      rawMonths !== undefined && rawMonths <= 11 ? rawMonths : undefined;

    if (ageYears !== undefined || ageMonths !== undefined) {
      return {
        ageYears,
        ageMonths,
      };
    }

    if (birthDateMatch) {
      return this.calculateAgeFromBirthDate(
        birthDateMatch[1],
        birthDateMatch[2],
        birthDateMatch[3],
      );
    }

    return {};
  };

  toNonNegativeInteger = (value?: string): number | undefined => {
    if (!value) {
      return undefined;
    }

    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue >= 0
      ? numberValue
      : undefined;
  };

  toMonthValue = (value?: string): number | undefined => {
    const numberValue = this.toNonNegativeInteger(value);

    return numberValue !== undefined && numberValue <= 11
      ? numberValue
      : undefined;
  };

  calculateAgeFromBirthDate = (
    dayValue: string,
    monthValue: string,
    yearValue: string,
  ): Pick<ExtractedPatientDetails, "ageYears" | "ageMonths"> => {
    const day = Number(dayValue);
    const month = Number(monthValue);
    const now = new Date();
    const shortYear = Number(yearValue);
    const fullYear = yearValue.length === 2
      ? shortYear <= now.getFullYear() % 100
        ? 2000 + shortYear
        : 1900 + shortYear
      : shortYear;
    const birthDate = new Date(fullYear, month - 1, day);

    if (
      !Number.isFinite(birthDate.getTime()) ||
      birthDate.getFullYear() !== fullYear ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day ||
      birthDate > now ||
      now.getFullYear() - birthDate.getFullYear() > 80
    ) {
      return {};
    }

    let ageYears = now.getFullYear() - birthDate.getFullYear();
    let ageMonths = now.getMonth() - birthDate.getMonth();

    if (now.getDate() < birthDate.getDate()) {
      ageMonths -= 1;
    }

    if (ageMonths < 0) {
      ageYears -= 1;
      ageMonths += 12;
    }

    return {
      ageYears: Math.max(ageYears, 0),
      ageMonths: Math.max(ageMonths, 0),
    };
  };

  extractAgeFromClinicaDate = (
    value: string,
  ): Pick<ExtractedPatientDetails, "ageYears" | "ageMonths"> => {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!match) return {};

    // The directory API returns US-style M/D/YYYY values.
    return this.calculateAgeFromBirthDate(match[2], match[1], match[3]);
  };

  extractPhone = (values: string[]): string => {
    for (const value of values) {
      const candidates = value.match(
        /(?:\+?972[\s().-]*|0)[2-9](?:[\s().-]*\d){7,8}/g,
      ) ?? [];

      for (const candidate of candidates) {
        let digits = candidate.replace(/\D/g, "");
        if (digits.startsWith("972")) {
          digits = `0${digits.slice(3)}`;
        }
        if (/^0[2-9]\d{7,8}$/.test(digits)) {
          return digits;
        }
      }
    }

    return "";
  };

  extractClientNumber = (
    values: string[],
  ): string | undefined => {
    const numbers = values.filter(
      (value) => /^\d{3,}$/.test(value) && !/^0[2-9]\d{7,8}$/.test(value),
    );

    return numbers[0];
  };

  extractClientNameWithPets = (
    values: string[],
  ): string => {
    const ignoredWords = [
      "מייל",
      "הודעת טקסט",
      "טלפון נייד",
      "טלפון בית",
      "כתובת",
      "שם הלקוח",
      "מס לקוח",
      "ניהול",
      "הגדרות",
      "יומן",
      "רשימת לקוחות",
      "מעקב לקוחות",
      "תזכורות",
      "דיווח כלבת",
      "יומן רופא",
      "חיפוש",
      "רענן",
      "סינון",
      "פרטי כרטיס אשראי",
      "כל הרופאים",
    ];

    const candidates = values.filter(
      (value) => {
        const hasHebrew =
          /[\u0590-\u05FF]/.test(value);

        const isPhone =
          /05\d{8}/.test(value);

        const isNumber =
          /^\d+$/.test(value);

        const isTooLong =
          value.length > 80;

        const isIgnored =
          ignoredWords.some((word) =>
            value.includes(word),
          );

        return (
          hasHebrew &&
          !isPhone &&
          !isNumber &&
          !isTooLong &&
          !isIgnored
        );
      },
    );

    const withPlus = candidates.find(
      (value) => value.includes("+"),
    );

    if (withPlus) {
      return withPlus;
    }

    return (
      candidates.sort(
        (a, b) => b.length - a.length,
      )[0] || ""
    );
  };

  isValidPetName = (name: string): boolean => {
    if (!name) {
      return false;
    }

    if (name.length > 40) {
      return false;
    }

    // Clinica occasionally returns the address/branch label in GetPetsNames.
    // Never treat an address-like directory value as an animal.
    if (
      /\d/.test(name) ||
      /\([^)]*(?:\u05d4\u05d0\u05d5\u05e1|\u05de\u05e8\u05db\u05d6|\u05e1\u05e0\u05d9\u05e3)[^)]*\)/u.test(name) ||
      /(?:\u05e8\u05d7(?:\u05d5\u05d1)?|\u05e9\u05d3(?:\u05e8\u05d5\u05ea)?|\u05de\u05d9\u05e7\u05d5\u05d3|street|road|avenue|address)/iu.test(name)
    ) {
      return false;
    }

    const ignoredWords = [
      "סינון",
      "פרטי",
      "כרטיס",
      "אשראי",
      "רשימת",
      "לקוחות",
      "תיקי",
      "יומן",
      "ניהול",
      "הגדרות",
      "רופא",
      "מעקב",
      "תזכורות",
    ];

    return !ignoredWords.some((word) =>
      name.includes(word),
    );
  };

  extractOwnerAndPetNames = (
    clientNameWithPets: string,
  ): { ownerName: string; petNames: string[] } => {
    const parts = clientNameWithPets
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      ownerName: parts[0] || clientNameWithPets.trim(),
      petNames: parts.length > 1 ? parts.slice(1) : [],
    };
  };

  removeDuplicates = (
    items: ImportedClinicaAggregate[],
  ): ImportedClinicaAggregate[] => {
    const merged = new Map<string, ImportedClinicaAggregate>();

    for (const item of items) {
      const normalizedName = this.normalizePatientName(item.patient.name);
      const key = item.patient.externalPatientId
        ? `pet:${item.patient.externalPatientId}`
        : item.patient.externalClientId
          ? `client:${item.patient.externalClientId}:${normalizedName}`
          : `owner:${item.patient.owner.phone}:${this.normalizePatientName(item.patient.owner.name)}:${normalizedName}`;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          patient: {
            ...item.patient,
            owner: { ...item.patient.owner },
          },
          medicalRecords: [...item.medicalRecords],
        });
        continue;
      }

      existing.patient = {
        ...item.patient,
        ...existing.patient,
        externalClientId:
          existing.patient.externalClientId ?? item.patient.externalClientId,
        externalPatientId:
          existing.patient.externalPatientId ?? item.patient.externalPatientId,
        gender: existing.patient.gender || item.patient.gender,
        breed: existing.patient.breed || item.patient.breed,
        species: existing.patient.species || item.patient.species,
        color: existing.patient.color || item.patient.color,
        weightKg: existing.patient.weightKg ?? item.patient.weightKg,
        ageYears: existing.patient.ageYears ?? item.patient.ageYears,
        ageMonths: existing.patient.ageMonths ?? item.patient.ageMonths,
        insurance: existing.patient.insurance || item.patient.insurance,
        treatingDoctor:
          existing.patient.treatingDoctor || item.patient.treatingDoctor,
        referringDoctor:
          existing.patient.referringDoctor || item.patient.referringDoctor,
        owner: {
          name: existing.patient.owner.name || item.patient.owner.name,
          phone: existing.patient.owner.phone || item.patient.owner.phone,
        },
      };

      for (const record of item.medicalRecords) {
        const recordIndex = existing.medicalRecords.findIndex(
          (candidate) => candidate.recordType === record.recordType,
        );
        if (recordIndex < 0) {
          existing.medicalRecords.push(record);
          continue;
        }
        const current = existing.medicalRecords[recordIndex];
        const currentScore =
          current.rawText.length + (current.table?.rows.length ?? 0) * 1000;
        const candidateScore =
          record.rawText.length + (record.table?.rows.length ?? 0) * 1000;
        if (candidateScore > currentScore) {
          existing.medicalRecords[recordIndex] = record;
        }
      }
    }

    return [...merged.values()];
  };

  removeDuplicateClientRows = (
    items: ExtractedClientRow[],
  ): ExtractedClientRow[] => {
    const merged = new Map<string, ExtractedClientRow>();

    for (const item of items) {
      const key = item.externalPatientId
        ? `client:${item.externalPatientId}`
        : `owner:${this.normalizePatientName(item.ownerName)}:${item.ownerPhone.replace(/\D/g, "")}`;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          ...item,
          petNames: [...item.petNames],
          externalPatientIds: [...item.externalPatientIds],
        });
        continue;
      }

      if (!existing.ownerPhone && item.ownerPhone) {
        existing.ownerPhone = item.ownerPhone;
      }
      item.petNames.forEach((petName, index) => {
        const normalizedName = this.normalizePatientName(petName);
        const existingPetIndex = existing.petNames.findIndex(
          (candidate) => this.normalizePatientName(candidate) === normalizedName,
        );
        const patientId = item.externalPatientIds[index] ?? "";
        if (existingPetIndex < 0) {
          existing.petNames.push(petName);
          existing.externalPatientIds.push(patientId);
        } else if (!existing.externalPatientIds[existingPetIndex] && patientId) {
          existing.externalPatientIds[existingPetIndex] = patientId;
        }
      });
      existing.detailPatientId =
        existing.detailPatientId || item.detailPatientId;
    }

    return [...merged.values()];
  };
}

export const clinicaScraperService = new ClinicaScraperService();
