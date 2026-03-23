import type { ICase } from "../../../models/case/index.js";

export const EXPORT_SERVICE_CONSTANTS = {
  MODULE: "export",
  CASE_DETAILS_TEMPLATE_FILE: "CaseDetailsTemplate.hbs",
  EXPORT_HOURS_PER_PAGE: 13,
  LOCALE: "he-IL",
  REQUIRED_CELL_CLASS: "required-cell",
  NEW_LINE: "\n",
  ENCODING: "utf-8",
  RELEASED_YES: "Yes",
  RELEASED_NO: "No",
  NOT_AVAILABLE: "N/A",
} as const;

export const buildCaseExportLines = (caseData: ICase): string[] => [
  `Case Export: ${caseData.serialId}`,
  `Created: ${caseData.createdAt?.toISOString() ?? EXPORT_SERVICE_CONSTANTS.NOT_AVAILABLE}`,
  `Grid Rows: ${caseData.caseDetailsGrid?.length ?? 0}`,
  `Archived: ${caseData.isArchived}`,
  `Released: ${
    caseData.releaseDate
      ? EXPORT_SERVICE_CONSTANTS.RELEASED_YES
      : EXPORT_SERVICE_CONSTANTS.RELEASED_NO
  }`,
];
