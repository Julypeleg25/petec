import { chromium, Browser, Page } from "playwright";
import { ScrapedPatient } from "../types/clinic.types";
import { ENV } from "../config/config";

interface LoginCredentials {
  username: string;
  password: string;
}

export class ClinicScraperService {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getBrowser(): Browser {
    if (!this.browser) {
      throw new Error("Browser is not initialized");
    }

    return this.browser;
  }

  async scrapePatients(credentials: LoginCredentials): Promise<ScrapedPatient[]> {
    const browser = this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await this.login(page, credentials);

      const patientsUrl = `${ENV.clinicaBaseUrl}/patients`;

      await page.goto(patientsUrl, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      return await this.extractPatients(page);
    } finally {
      await context.close();
    }
  }

  private async login(page: Page, credentials: LoginCredentials): Promise<void> {
    const loginUrl = `${ENV.clinicaBaseUrl}/login.aspx?ReturnUrl=%2f`;

    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.fill('input[type="text"]', credentials.username);
    await page.fill('input[type="password"]', credentials.password);

    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.click('input[type="submit"], button[type="submit"]'),
    ]);

    const currentUrl = page.url().toLowerCase();

    if (currentUrl.includes("login")) {
      throw new Error("Login failed or still on login page");
    }
  }

  private async extractPatients(page: Page): Promise<ScrapedPatient[]> {
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    const patients: ScrapedPatient[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator("td");
      const cellCount = await cells.count();

      const values: string[] = [];

      for (let j = 0; j < cellCount; j++) {
        const text = (await cells.nth(j).innerText()).trim();
        values.push(text);
      }

      const patientName = values[0];
      const ownerName = values[1];
      const ownerPhone = values[2];
      const photoName = values[3]?.trim();

      if (!patientName || !ownerName || !ownerPhone) {
        continue;
      }

      const scrapedPatient: ScrapedPatient = {
        name: patientName,
        ownerName,
        ownerPhone,
      };

      if (photoName) {
        scrapedPatient.photoName = photoName;
      }

      patients.push(scrapedPatient);
    }

    return patients;
  }
}