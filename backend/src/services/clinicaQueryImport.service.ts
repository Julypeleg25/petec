import { clinicaImportService } from "./clinicaImport.service.js";
import { clinicaScraperService } from "./clinicaScraper.service.js";

class ClinicaQueryImportService {
  runFullSync = async () => {
    await clinicaScraperService.init();

    try {
      const items = await clinicaScraperService.scrapeClients();
      const imported = await clinicaImportService.importMany(items);

      return {
        count: imported.length,
        data: imported,
      };
    } finally {
      await clinicaScraperService.close();
    }
  };
}

export const clinicaQueryImportService = new ClinicaQueryImportService();