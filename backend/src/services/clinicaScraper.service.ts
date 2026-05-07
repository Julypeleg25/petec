import { Browser, chromium, Page } from "playwright";
import { ENV } from "../config/config.js";
import { ImportedClinicaAggregate } from "../utils/clinica-query.types.js";

interface LoginCredentials {
  username: string;
  password: string;
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

  login = async (page: Page, credentials: LoginCredentials): Promise<void> => {
    const loginUrl = `${ENV.clinicaBaseUrl}/login.aspx?ReturnUrl=%2f`;

    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.fill("#ctl00_MainContent_Login1_UserName", credentials.username);
    await page.fill("#ctl00_MainContent_Login1_Password", credentials.password);

    await Promise.all([
      page.waitForLoadState("networkidle").catch(() => undefined),
      page.click("#ctl00_MainContent_Login1_LoginButton"),
    ]);

    if (page.url().toLowerCase().includes("login")) {
      throw new Error("Login failed");
    }
  };

  selectClinicCenterIfNeeded = async (page: Page): Promise<void> => {
    const centerSelect = page.locator("select").first();
    const centerButton = page.locator("#ctl00_MainContent_Button1");

    if ((await centerSelect.count()) === 0 || (await centerButton.count()) === 0) {
      return;
    }

    await Promise.all([
      page.waitForLoadState("networkidle").catch(() => undefined),
      centerButton.click(),
    ]);
  };

  openClientsPage = async (page: Page): Promise<void> => {
    await page.goto(`${ENV.clinicaBaseUrl}/vetclinic/therapists/patientlistvet.aspx`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page.waitForTimeout(1500);
  };

  scrapeClients = async (): Promise<ImportedClinicaAggregate[]> => {
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

      return await this.extractPatientsFromClientsTable(page);
    } finally {
      await context.close();
    }
  };

  extractPatientsFromClientsTable = async (page: Page): Promise<ImportedClinicaAggregate[]> => {
    const table = page.locator("table").filter({ hasText: "שם הלקוח" }).first();
    const rows = table.locator("tr");
    const rowCount = await rows.count();

    const items: ImportedClinicaAggregate[] = [];

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td");
      const cellCount = await cells.count();

      if (cellCount < 3) {
        continue;
      }

      const values: string[] = [];

      for (let j = 0; j < cellCount; j++) {
        const value = ((await cells.nth(j).textContent()) || "").trim();

        if (value) {
          values.push(value);
        }
      }

      const phone = this.extractPhone(values);
      const clientNameWithPets = this.extractClientNameWithPets(values);
      const externalPatientId = this.extractClientNumber(values);

      if (!phone || !clientNameWithPets) {
        continue;
      }

      const parts = clientNameWithPets
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);

      const ownerName = parts[0] || clientNameWithPets;
      const petNames = parts.length > 1 ? parts.slice(1) : [clientNameWithPets];

      for (const petName of petNames) {
        if (!this.isValidPetName(petName)) {
          continue;
        }

        items.push({
          patient: {
            externalPatientId,
            name: petName,
            owner: {
              name: ownerName,
              phone,
            },
          },
        });
      }
    }

    return this.removeDuplicates(items);
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

  extractClientNumber = (values: string[]): string | undefined => {
    const numbers = values.filter((value) => /^\d{3,}$/.test(value));
    return numbers[0];
  };

  extractClientNameWithPets = (values: string[]): string => {
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

    const candidates = values.filter((value) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(value);
      const isPhone = /05\d{8}/.test(value);
      const isNumber = /^\d+$/.test(value);
      const isTooLong = value.length > 80;
      const isIgnored = ignoredWords.some((word) => value.includes(word));

      return hasHebrew && !isPhone && !isNumber && !isTooLong && !isIgnored;
    });

    const withPlus = candidates.find((value) => value.includes("+"));

    if (withPlus) {
      return withPlus;
    }

    return candidates.sort((a, b) => b.length - a.length)[0] || "";
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

    return !ignoredWords.some((word) => name.includes(word));
  };

  removeDuplicates = (items: ImportedClinicaAggregate[]): ImportedClinicaAggregate[] => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.patient.name}-${item.patient.owner.phone}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  };
}

export const clinicaScraperService = new ClinicaScraperService();