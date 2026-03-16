import { logger } from "@config/logger";
import { NotFoundError } from "@constants/error.constants";
import type { ICase } from "@models/case";
import { AnimalVitalsModel } from "@models/lookups";
import { buildPatientExportFileName } from "@petec/shared";
import { caseRepository } from "@repositories/patient";
import { patientMedicineRepository } from "@repositories/patient";
import type { PopulatedCase } from "@services/patient/exportService.types";
import { EXPORT_SERVICE_CONSTANTS } from "@services/patient/utils/exportService.utils";
import {
  buildCaseExportTemplateData,
  resolveCaseExportRows,
  sortCaseGridRows,
} from "@utils/caseExport.utils";
import { buildAnimalVitalsMap } from "@utils/animalVitals.utils";
import { createPdf } from "@utils/puppeteer.utils";
import type { MedWithPopulatedName } from "@app-types/patient.types";

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
