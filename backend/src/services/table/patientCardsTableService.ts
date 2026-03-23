import type { MongoFilter } from "../../types/global.types.js";
import { mapCaseToPatientCardRowDTO, type PatientCardCaseTableDoc } from "../../mappers/table/table.mappers.js";
import { buildPaginatedTableResponse } from "../../mappers/table/table.service.mappers.js";
import {
  buildCasesFilter,
  extractHasAlertsFilter,
  toSkip,
  toSortRecord,
} from "../../mappers/table/table.mappers.utils.js";
import { caseRepository } from "../../repositories/patient/index.js";
import { caseAlertsService } from "../patient/index.js";
import type { AllowedTableName, PaginatedResponse, SortOrder } from "@petec/shared";

const PATIENT_CARD_CASE_SELECT_FIELDS = [
  "_id",
  "serialId",
  "masterCaseId",
  "admission",
  "flags",
  "dates",
  "refs",
  "caseDetailsGrid",
  "patientId",
  "createdAt",
  "updatedAt",
].join(" ");

const PATIENT_CARD_POPULATE_FIELDS = ["patientId"] as const;

const isProcedureTable = (tableName: AllowedTableName): boolean =>
  tableName === "cases";

export class PatientCardsTableService {
  async getTableData(
    tableName: AllowedTableName,
    filters: MongoFilter,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: SortOrder,
  ): Promise<PaginatedResponse<ReturnType<typeof mapCaseToPatientCardRowDTO>>> {
    const hasAlerts = extractHasAlertsFilter(filters);
    const baseFilter = await buildCasesFilter(filters, {
      isProcedure: isProcedureTable(tableName),
    });
    const sort = toSortRecord(sortBy, sortOrder);
    const skip = toSkip(page, limit);

    if (hasAlerts) {
      const docs = (await caseRepository.findManyLean(baseFilter, {
        sort,
        select: PATIENT_CARD_CASE_SELECT_FIELDS,
        populate: [...PATIENT_CARD_POPULATE_FIELDS],
      })) as PatientCardCaseTableDoc[];
      const docsWithAlerts = await caseAlertsService.attachAlertCounts(docs);
      const filteredDocs = docsWithAlerts.filter((doc) => doc.numOfAlerts > 0);
      const pageDocs = filteredDocs.slice(skip, skip + limit);

      return buildPaginatedTableResponse(
        pageDocs.map((doc) => mapCaseToPatientCardRowDTO(doc)),
        filteredDocs.length,
        page,
        limit,
      );
    }

    const [docs, total] = await Promise.all([
      caseRepository.findManyLean(baseFilter, {
        skip,
        limit,
        sort,
        select: PATIENT_CARD_CASE_SELECT_FIELDS,
        populate: [...PATIENT_CARD_POPULATE_FIELDS],
      }),
      caseRepository.countDocuments(baseFilter),
    ]);

    const docsWithAlerts = await caseAlertsService.attachAlertCounts(
      docs as PatientCardCaseTableDoc[],
    );

    return buildPaginatedTableResponse(
      docsWithAlerts.map((doc) => mapCaseToPatientCardRowDTO(doc)),
      total,
      page,
      limit,
    );
  }
}

export const patientCardsTableService = new PatientCardsTableService();
