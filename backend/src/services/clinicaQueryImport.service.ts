import { clinicaImportService } from "@services/clinicaImport.service";
import { clinicaScraperService } from "@services/clinicaScraper.service";
import { llmQueryService } from "@services/llmQuery.service";
import { ImportedClinicaAggregate } from "@types/clinica-query.types";

interface QueryImportInput {
  username: string;
  password: string;
  query: string;
}

interface QueryImportResult {
  parsedQuery: unknown;
  importedCount: number;
  results: ImportedClinicaAggregate[];
}

export class ClinicaQueryImportService {
  async run(input: QueryImportInput): Promise<QueryImportResult> {
    const parsedQuery = await llmQueryService.parseQuery(input.query);

    await clinicaScraperService.init();

    try {
      const aggregates = await clinicaScraperService.searchByParsedQuery(
        {
          username: input.username,
          password: input.password,
        },
        parsedQuery,
      );

      const importedResults: ImportedClinicaAggregate[] = [];

      for (const aggregate of aggregates) {
        const imported = await clinicaImportService.importAggregate(aggregate);
        importedResults.push(imported);
      }

      return {
        parsedQuery,
        importedCount: importedResults.length,
        results: importedResults,
      };
    } finally {
      await clinicaScraperService.close();
    }
  }
}

export const clinicaQueryImportService = new ClinicaQueryImportService();