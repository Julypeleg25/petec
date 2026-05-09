import { Browser, chromium, Page } from "playwright";
import { ENV } from "../config/config.js";
import {
  ClinicaMedicalRecordDto,
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
}

class ClinicaScraperService {
  private browser: Browser | null = null;

  init = async (): Promise<void> => {
    this.browser = await chromium.launch({
      headless: true,
    });
  };

  close = async (): Promise<void> => {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
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

    await page.fill(
      "#ctl00_MainContent_Login1_UserName",
      credentials.username,
    );

    await page.fill(
      "#ctl00_MainContent_Login1_Password",
      credentials.password,
    );

    await Promise.all([
      page.waitForLoadState("networkidle").catch(() => undefined),
      page.click("#ctl00_MainContent_Login1_LoginButton"),
    ]);

    if (page.url().toLowerCase().includes("login")) {
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
      page.waitForLoadState("networkidle").catch(() => undefined),
      centerButton.click(),
    ]);
  };

  openClientsPage = async (
    page: Page,
  ): Promise<void> => {
    await page.goto(
      `${ENV.clinicaBaseUrl}/vetclinic/therapists/patientlistvet.aspx`,
      {
        waitUntil: "networkidle",
        timeout: 60000,
      },
    );

    await page.waitForTimeout(1500);
  };

  scrapeClients = async (): Promise<
    ImportedClinicaAggregate[]
  > => {
    const browser = this.getBrowser();

    const context = await browser.newContext();

    const page = await context.newPage();

    try {
      await this.login(page, {
        username: ENV.clinicUsername,
        password: ENV.clinicPassword,
      });

      await this.selectClinicCenterIfNeeded(page);

      await this.openClientsPage(page);

      const rows = await this.extractClientRows(page);

      const results: ImportedClinicaAggregate[] = [];

      for (const row of rows) {
        let medicalRecords: ClinicaMedicalRecordDto[] = [];

        try {
          medicalRecords =
            await this.scrapeClientMedicalRecords(
              page,
              row,
            );
        } catch {
          medicalRecords = [];
        }

        for (const petName of row.petNames) {
          results.push({
            patient: {
              externalPatientId:
                row.externalPatientId,

              name: petName,

              owner: {
                name: row.ownerName,
                phone: row.ownerPhone,
              },
            },

            medicalRecords:
              medicalRecords.filter(
                (record) =>
                  record.patientName === petName,
              ),
          });
        }

        try {
          await this.openClientsPage(page);
        } catch {
          break;
        }
      }

      return this.removeDuplicates(results);
    } finally {
      await context.close().catch(() => undefined);
    }
  };

  extractClientRows = async (
    page: Page,
  ): Promise<ExtractedClientRow[]> => {
    const table = page
      .locator("table")
      .filter({ hasText: "שם הלקוח" })
      .first();

    const rows = table.locator("tr");

    const rowCount = await rows.count();

    const clients: ExtractedClientRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td");

      const cellCount = await cells.count();

      if (cellCount < 3) {
        continue;
      }

      const values: string[] = [];

      for (let j = 0; j < cellCount; j++) {
        const value = (
          (await cells.nth(j).textContent()) || ""
        ).trim();

        if (value) {
          values.push(value);
        }
      }

      const phone = this.extractPhone(values);

      const clientNameWithPets =
        this.extractClientNameWithPets(values);

      const externalPatientId =
        this.extractClientNumber(values);

      if (!phone || !clientNameWithPets) {
        continue;
      }

      const parts = clientNameWithPets
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);

      const ownerName =
        parts[0] || clientNameWithPets;

      const petNames =
        parts.length > 1
          ? parts.slice(1)
          : [clientNameWithPets];

      const validPetNames = petNames.filter(
        (name) => this.isValidPetName(name),
      );

      if (validPetNames.length === 0) {
        continue;
      }

      clients.push({
        ownerName,
        ownerPhone: phone,
        petNames: validPetNames,
        externalPatientId,
      });
    }

    return this.removeDuplicateClientRows(clients);
  };

  scrapeClientMedicalRecords = async (
    page: Page,
    row: ExtractedClientRow,
  ): Promise<ClinicaMedicalRecordDto[]> => {
    const records: ClinicaMedicalRecordDto[] = [];

    try {
      const ownerLabel = page
        .locator("span.listLable", {
          hasText: row.ownerName,
        })
        .first();

      if ((await ownerLabel.count()) === 0) {
        return records;
      }

      await Promise.all([
        page
          .waitForLoadState("networkidle")
          .catch(() => undefined),

        ownerLabel.click(),
      ]);

      await page.waitForTimeout(1500);

      const tabs = [
        {
          selector: "#tab_Second",
          type: "customerFollowUp",
        },

        {
          selector: "#tab_Third",
          type: "doctorJournal",
        },

        {
          selector:
            "#ctl00_MainContent_tab_Fourth",

          type: "doctorJournalExtra",
        },

        {
          selector: "#tab_Fifth",
          type: "rabiesReport",
        },

        {
          selector: "#tab_Sixth",
          type: "visitDetails",
        },
      ];

      for (const tab of tabs) {
        try {
          const tabElement =
            page.locator(tab.selector);

          if ((await tabElement.count()) === 0) {
            continue;
          }

          const isVisible = await tabElement
            .isVisible()
            .catch(() => false);

          if (!isVisible) {
            continue;
          }

          await Promise.all([
            page
              .waitForLoadState("networkidle")
              .catch(() => undefined),

            tabElement.click({
              timeout: 5000,
            }),
          ]);

          await page.waitForTimeout(1000);

          const rawText = await page
            .locator("body")
            .innerText();

          const cleanText =
            this.cleanMedicalText(rawText);

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
    } catch {
      return [];
    }
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

  extractPhone = (values: string[]): string => {
    for (const value of values) {
      const match = value.match(/05\d{8}/);

      if (match) {
        return match[0];
      }
    }

    return "";
  };

  extractClientNumber = (
    values: string[],
  ): string | undefined => {
    const numbers = values.filter((value) =>
      /^\d{3,}$/.test(value),
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

  removeDuplicates = (
    items: ImportedClinicaAggregate[],
  ): ImportedClinicaAggregate[] => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key =
        `${item.patient.name}-${item.patient.owner.phone}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  };

  removeDuplicateClientRows = (
    items: ExtractedClientRow[],
  ): ExtractedClientRow[] => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key =
        `${item.ownerName}-${item.ownerPhone}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  };
}

export const clinicaScraperService =
  new ClinicaScraperService();