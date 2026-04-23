import { clinicaImportService } from "../services/clinicaImport.service.js";
import { clinicaScraperService } from "../services/clinicaScraper.service.js";
import { llmQueryService } from "../services/llmQuery.service.js";
import {
  ImportedClinicaAggregate,
  ParsedClinicaQuery,
} from "../utils/clinica-query.types.js";

interface QueryImportInput {
  username: string;
  password: string;
  query: string;
}

interface SyncAllInput {
  username: string;
  password: string;
}

interface QueryImportResult {
  parsedQuery: ParsedClinicaQuery;
  importedCount: number;
  results: ImportedClinicaAggregate[];
}

class ClinicaQueryImportService {
  async runQueryImport(input: QueryImportInput): Promise<QueryImportResult> {
    const parsedQuery = await llmQueryService.parseUserQuery(input.query);

    await clinicaScraperService.init();

    try {
      const rawText = await clinicaScraperService.scrapeRawTextByQuery(
        {
          username: input.username,
          password: input.password,
        },
        parsedQuery,
      );

      const mappedItems = await llmQueryService.mapRawTextToClinicaData(rawText);
      const imported = await clinicaImportService.importMany(mappedItems);

      return {
        parsedQuery,
        importedCount: imported.length,
        results: imported,
      };
    } finally {
      await clinicaScraperService.close();
    }
  }

  async runFullSync(input: SyncAllInput): Promise<QueryImportResult> {
    const parsedQuery: ParsedClinicaQuery = {
      searchText: "",
      includeTreatments: true,
    };

    await clinicaScraperService.init();

    try {
      const rawText = await clinicaScraperService.scrapeAllRawText({
        username: input.username,
        password: input.password,
      });

      const mappedItems = await llmQueryService.mapRawTextToClinicaData(rawText);
      const imported = await clinicaImportService.importMany(mappedItems);

      return {
        parsedQuery,
        importedCount: imported.length,
        results: imported,
      };
    } finally {
      await clinicaScraperService.close();
    }
  }
}

export const clinicaQueryImportService = new ClinicaQueryImportService();