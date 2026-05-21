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

type ExtractedDomField = {
  label: string;
  value: string;
};

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
              externalPatientId: row.externalPatientId,
            
              name: petName,
            
              owner: {
                name: row.ownerName,
                phone: row.ownerPhone,
              },
            
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

      this.mergePatientDetails(
        row,
        await this.extractPatientDetailsFromPage(page),
      );

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

          this.mergePatientDetails(
            row,
            this.extractPatientDetails(rawText),
          );

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

  extractPatientDetailsFromPage = async (
    page: Page,
  ): Promise<ExtractedPatientDetails> => {
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    const domFields = await page
      .evaluate<ExtractedDomField[]>(() => {
        const cleanText = (value: string | null | undefined): string =>
          (value ?? "").replace(/\s+/g, " ").trim();

        const getElementValue = (element: Element): string => {
          if (element instanceof HTMLSelectElement) {
            return cleanText(
              element.selectedOptions[0]?.textContent || element.value,
            );
          }

          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement
          ) {
            return cleanText(element.value);
          }

          return cleanText(element.textContent);
        };

        const getLabelText = (element: Element): string => {
          const id = element.getAttribute("id");
          const ariaLabel = element.getAttribute("aria-label");
          const name = element.getAttribute("name");

          if (id) {
            const explicitLabel = document.querySelector(`label[for="${id}"]`);
            const explicitText = cleanText(explicitLabel?.textContent);

            if (explicitText) {
              return explicitText;
            }
          }

          const parentLabel = element.closest("label");
          const parentLabelText = cleanText(parentLabel?.textContent);

          if (parentLabelText) {
            return parentLabelText;
          }

          const tableCell = element.closest("td");
          const previousCellText = cleanText(
            tableCell?.previousElementSibling?.textContent,
          );

          if (previousCellText) {
            return previousCellText;
          }

          const previousElementText = cleanText(
            element.previousElementSibling?.textContent,
          );

          if (previousElementText) {
            return previousElementText;
          }

          return cleanText([ariaLabel, id, name].filter(Boolean).join(" "));
        };

        return Array.from(
          document.querySelectorAll("input, select, textarea"),
        )
          .map((element) => ({
            label: getLabelText(element),
            value: getElementValue(element),
          }))
          .filter((field) => field.label && field.value);
      })
      .catch(() => []);

    const domText = domFields
      .map((field) => `${field.label}: ${field.value}`)
      .join("\n");

    return this.extractPatientDetails(`${bodyText}\n${domText}`);
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

  cleanDetailValue = (value: string): string =>
    value
      .replace(/^[:\-\s]+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

  extractWeightKg = (text: string): number | undefined => {
    const match =
      text.match(/(?:משקל|weight|wt)[^\d]{0,60}(\d+(?:[.,]\d+)?)/i) ??
      text.match(/(\d+(?:[.,]\d+)?)\s*(?:קילו|קג|ק"ג|ק״ג|kg)/i);

    if (!match?.[1]) {
      return undefined;
    }

    const weight = Number(match[1].replace(",", "."));

    return Number.isFinite(weight) ? weight : undefined;
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
    const fullYear =
      yearValue.length === 2 ? Number(`20${yearValue}`) : Number(yearValue);
    const birthDate = new Date(fullYear, month - 1, day);

    if (
      !Number.isFinite(birthDate.getTime()) ||
      birthDate.getFullYear() !== fullYear ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day
    ) {
      return {};
    }

    const now = new Date();
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

export const clinicaScraperService = new ClinicaScraperService();
