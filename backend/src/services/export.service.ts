import { logger } from "@config/logger";
import { caseRepository } from "@repositories/case.repository";
import { NotFoundError } from "@constants/error.constants";
import type { ICase } from "@models/Case";
import {
    buildCaseExportLines,
    EXPORT_SERVICE_CONSTANTS,
} from "@services/utils/export.service.utils";

const MODULE = EXPORT_SERVICE_CONSTANTS.MODULE;

export class ExportService {
    async exportCase(caseSerialId: string): Promise<{ caseData: ICase; pdfBuffer: Buffer }> {
        const caseDoc = await caseRepository.findBySerialIdPopulated(caseSerialId);
        if (!caseDoc) {
            throw new NotFoundError("Case not found for export");
        }

        const caseData = caseDoc.toObject() as ICase;

        const lines = buildCaseExportLines(caseData);
        const pdfBuffer = Buffer.from(
            lines.join(EXPORT_SERVICE_CONSTANTS.NEW_LINE),
            EXPORT_SERVICE_CONSTANTS.ENCODING,
        );

        logger.info("Case exported", {
            module: MODULE,
            case_serial_id: caseSerialId,
            bytes: pdfBuffer.length,
            row_count: caseData.caseDetailsGrid?.length ?? 0,
        });

        return { caseData, pdfBuffer };
    }
}

export const exportService = new ExportService();
