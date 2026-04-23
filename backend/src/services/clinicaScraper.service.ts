import { Browser, chromium, Page } from "playwright";
import { ENV } from "../config/config.js";
import { ParsedClinicaQuery } from "../utils/clinica-query.types.js";

interface LoginCredentials {
  username: string;
  password: string;
}

class ClinicaScraperService {
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

    if (page.url().toLowerCase().includes("login")) {
      throw new Error("Clinica login failed");
    }
  }

  async scrapeRawTextByQuery(
    credentials: LoginCredentials,
    parsedQuery: ParsedClinicaQuery,
  ): Promise<string> {
    const browser = this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await this.login(page, credentials);

      const candidateUrls = [
        `${ENV.clinicaBaseUrl}/patients`,
        `${ENV.clinicaBaseUrl}/clients`,
        `${ENV.clinicaBaseUrl}/default.aspx`,
        ENV.clinicaBaseUrl,
      ];

      let loaded = false;

      for (const url of candidateUrls) {
        try {
          await page.goto(url, {
            waitUntil: "networkidle",
            timeout: 30000,
          });

          loaded = true;
          break;
        } catch {
          continue;
        }
      }

      if (!loaded) {
        throw new Error("Could not open any Clinica data page");
      }

      const searchInput = page.locator(
        'input[type="search"], input[name*="search"], input[id*="search"], input[type="text"]',
      ).first();

      if (await searchInput.count()) {
        await searchInput.fill(parsedQuery.searchText);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2000);
      }

      return await page.locator("body").innerText();
    } finally {
      await context.close();
    }
  }

  async scrapeAllRawText(credentials: LoginCredentials): Promise<string> {
    return this.scrapeRawTextByQuery(credentials, {
      searchText: "",
      includeTreatments: true,
    });
  }
}

export const clinicaScraperService = new ClinicaScraperService();