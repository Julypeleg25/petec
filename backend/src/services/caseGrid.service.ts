import { logger } from "@config/logger";
import { caseRepository } from "@repositories/case.repository";
import { NotFoundError, ValidationError } from "@constants/error.constants";
import type { ICaseDetailsRow } from "@models/Case";
import {
  normalizeCaseDetailsGrid,
  toGridValidationDetails,
  validateCaseDetailsGrid,
} from "@services/utils/caseGrid.service.utils";

const MODULE = "caseGrid";

export class CaseGridService {
  async saveGrid(
    caseSerialId: string,
    grid: Partial<ICaseDetailsRow>[][] | Partial<ICaseDetailsRow>[],
  ): Promise<void> {
    const normalizedRows = normalizeCaseDetailsGrid(grid);
    const validationIssues = validateCaseDetailsGrid(normalizedRows);

    if (validationIssues.length > 0) {
      logger.warn("Grid validation failed", {
        module: MODULE,
        case_serial_id: caseSerialId,
        issue_count: validationIssues.length,
      });
      throw new ValidationError(
        "Case details validation failed",
        toGridValidationDetails(validationIssues),
      );
    }

    const updatedCase = await caseRepository.updateCaseDetailsGridBySerialId(
      caseSerialId,
      normalizedRows,
    );
    if (!updatedCase) {
      throw new NotFoundError("Case not found");
    }

    logger.info("Grid saved", {
      module: MODULE,
      case_serial_id: caseSerialId,
      row_count: normalizedRows.length,
    });
  }

  async getGrid(caseSerialId: string): Promise<ICaseDetailsRow[]> {
    const caseDoc = await caseRepository.findBySerialId(caseSerialId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found");
    }
    return caseDoc.caseDetailsGrid ?? [];
  }

  async getCaseDailyDetails(
    caseSerialId: string,
    rowId: string,
  ): Promise<ICaseDetailsRow> {
    const caseDoc = await caseRepository.findBySerialId(caseSerialId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found");
    }

    const row = caseDoc.caseDetailsGrid.find(
      (gridRow) => gridRow._id?.toString() === rowId,
    );
    if (!row) {
      throw new NotFoundError("Grid row not found");
    }
    return row;
  }
}

export const caseGridService = new CaseGridService();
