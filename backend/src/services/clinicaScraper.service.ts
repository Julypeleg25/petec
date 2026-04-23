import { Browser, chromium, Page } from "playwright";
import { ENV } from "@config/config";
import {
  ClinicaPatientDto,
  ClinicaTreatmentDto,
  ImportedClinicaAggregate,
  ParsedClinicaQuery,
} from "@types/clinica-query.types";

interface LoginCredentials {
  username: string;
  password: string;
}

export class ClinicaScraperService {
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
      throw new Error("Login failed");
    }
  }

  async searchByParsedQuery(
    credentials: LoginCredentials,
    parsedQuery: ParsedClinicaQuery,
  ): Promise<ImportedClinicaAggregate[]> {
    const browser = this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await this.login(page, credentials);

      const searchValue =
        parsedQuery.filters.patientName ||
        parsedQuery.filters.ownerPhone ||
        parsedQuery.filters.ownerName ||
        "";

      if (!searchValue) {
        return [];
      }

      const searchUrl = `${ENV.clinicaBaseUrl}/patients/search`;

      await page.goto(searchUrl, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      await page.fill('input[type="search"], input[name="search"], input[type="text"]', searchValue);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle");

      const patients = await this.extractPatientSearchResults(page);
      const filtered = this.filterResults(patients, parsedQuery);

      const results: ImportedClinicaAggregate[] = [];

      for (const patient of filtered) {
        const treatments = parsedQuery.includeTreatments
          ? await this.fetchTreatmentsByExternalPatientId(credentials, patient.externalPatientId)
          : [];

        results.push({
          patient,
          treatments,
        });
      }

      return results;
    } finally {
      await context.close();
    }
  }

  async fetchTreatmentsByExternalPatientId(
    credentials: LoginCredentials,
    externalPatientId: string,
  ): Promise<ClinicaTreatmentDto[]> {
    const browser = this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await this.login(page, credentials);

      const treatmentsUrl = `${ENV.clinicaBaseUrl}/patients/${externalPatientId}/treatments`;

      await page.goto(treatmentsUrl, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      return await this.extractTreatments(page);
    } finally {
      await context.close();
    }
  }

  private filterResults(
    results: ClinicaPatientDto[],
    parsedQuery: ParsedClinicaQuery,
  ): ClinicaPatientDto[] {
    return results.filter((item) => {
      const matchesPatientName = parsedQuery.filters.patientName
        ? item.name.toLowerCase().includes(parsedQuery.filters.patientName.toLowerCase())
        : true;

      const matchesOwnerName = parsedQuery.filters.ownerName
        ? item.owner.name.toLowerCase().includes(parsedQuery.filters.ownerName.toLowerCase())
        : true;

      const matchesOwnerPhone = parsedQuery.filters.ownerPhone
        ? item.owner.phone.includes(parsedQuery.filters.ownerPhone)
        : true;

      return matchesPatientName && matchesOwnerName && matchesOwnerPhone;
    });
  }

  private async extractPatientSearchResults(page: Page): Promise<ClinicaPatientDto[]> {
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    const patients: ClinicaPatientDto[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator("td");
      const cellCount = await cells.count();

      const values: string[] = [];
      for (let j = 0; j < cellCount; j++) {
        values.push((await cells.nth(j).innerText()).trim());
      }

      const externalPatientId = values[0];
      const patientName = values[1];
      const ownerName = values[2];
      const ownerPhone = values[3];
      const photoName = values[4];

      if (!externalPatientId || !patientName || !ownerName || !ownerPhone) {
        continue;
      }

      const patient: ClinicaPatientDto = {
        externalPatientId,
        name: patientName,
        owner: {
          name: ownerName,
          phone: ownerPhone,
        },
      };

      if (photoName) {
        patient.photoName = photoName;
      }

      patients.push(patient);
    }

    return patients;
  }

  private async extractTreatments(page: Page): Promise<ClinicaTreatmentDto[]> {
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    const treatments: ClinicaTreatmentDto[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator("td");
      const cellCount = await cells.count();

      const values: string[] = [];
      for (let j = 0; j < cellCount; j++) {
        values.push((await cells.nth(j).innerText()).trim());
      }

      const treatmentDate = values[0];
      const type = values[1];
      const description = values[2];
      const externalTreatmentId = values[3];

      if (!treatmentDate || !type) {
        continue;
      }

      const treatment: ClinicaTreatmentDto = {
        treatmentDate,
        type,
      };

      if (description) {
        treatment.description = description;
      }

      if (externalTreatmentId) {
        treatment.externalTreatmentId = externalTreatmentId;
      }

      treatments.push(treatment);
    }

    return treatments;
  }
}

export const clinicaScraperService = new ClinicaScraperService();