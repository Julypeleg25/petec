import { logger } from "../../config/logger.js";
import { NotFoundError } from "../../constants/error.constants.js";
import type { ICase } from "../../models/case/index.js";
import { AnimalVitalsModel } from "../../models/lookups/index.js";
import { buildPatientExportFileName } from "@petec/shared";
import { caseRepository } from "../../repositories/patient/index.js";
import { patientMedicineRepository } from "../../repositories/patient/index.js";
import type { PopulatedCase } from "./exportService.types.js";
import { EXPORT_SERVICE_CONSTANTS } from "./utils/exportService.utils.js";
import {
  buildCaseExportTemplateData,
  resolveCaseExportRows,
  sortCaseGridRows,
} from "../../utils/caseExport.utils.js";
import { buildAnimalVitalsMap } from "../../utils/animalVitals.utils.js";
import { createPdf } from "../../utils/puppeteer.utils.js";
import type { MedWithPopulatedName } from "../../types/patient.types.js";

const MODULE = EXPORT_SERVICE_CONSTANTS.MODULE;

export class ExportService {
  async exportCase(
    caseId: string,
    targetDate?: string,
  ): Promise<{ caseData: ICase; pdfPath: string }> {
    const caseDoc = await caseRepository.findByIdPopulated(caseId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found for export");
    }

    const caseData = caseDoc.toObject() as PopulatedCase;
    const releaseMedicines = await patientMedicineRepository.findByCaseId(caseDoc._id);
    const animalTypeId = caseData.refs.animalTypeId?._id;
    const animalVitals = animalTypeId
      ? await AnimalVitalsModel.find({ animalTypeId: String(animalTypeId) }).lean()
      : [];
    const vitalsMap = buildAnimalVitalsMap(animalVitals);

    const gridRows = Array.isArray(caseData.caseDetailsGrid)
      ? caseData.caseDetailsGrid
      : [];
    const sortedGridRows = sortCaseGridRows(gridRows);
    const { dayRowsForGrid, exportDate } = resolveCaseExportRows(
      sortedGridRows,
      targetDate,
    );
    const templateData = buildCaseExportTemplateData({
      caseData,
      dayRowsByHour: dayRowsForGrid,
      allGridRows: sortedGridRows,
      exportDate,
      vitalsMap,
      releaseMedicines: releaseMedicines.map(
        (doc) => doc.toObject() as MedWithPopulatedName,
      ),
    });

    const fileName = buildPatientExportFileName(caseData.serialId);
    const pdfPath = await createPdf(
      EXPORT_SERVICE_CONSTANTS.CASE_DETAILS_TEMPLATE_FILE,
      templateData,
      fileName,
    );

    logger.info("Case exported to PDF", {
      module: MODULE,
      case_id: caseId,
      case_serial_id: caseData.serialId,
      date: exportDate,
      pdf_path: pdfPath,
    });

    return { caseData: caseData as ICase, pdfPath };
  }
}

export const exportService = new ExportService();
