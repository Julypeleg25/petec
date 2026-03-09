import type {
  CaseDetailsDataSchema,
  CaseDetailsResponseDTO,
  CaseDetailsResponseRowDTO,
} from "@petec/shared";
import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import {
  CASE_GRID_FIRST_DATA_COLUMN_INDEX,
  getCaseDayPrimaryDataRow,
  getCaseGridExpectedHourByIndex,
  resolveCaseDayStartHour,
  sortCaseDayRowsByIndex,
} from "../../CaseDetailsTable/caseGrid.utils";
import { defaultCaseDailyDataTemplate } from "../types/savePatient.types";
import {
  normalizeCaseDetailsDate,
  normalizeCaseDetailsTime,
} from "./savePatientCaseDetails.utils";
import { cloneCells, toDateKey } from "./savePatientCommon.utils";
import {
  mapCaseDetailsApiRowToUiRow,
  mapCaseDetailsRowToDto,
} from "./savePatientCaseDetailsGridMappers.utils";
import {
  buildPrimarySelectionRow,
  normalizeDailyRowsByPrimarySelection,
  resolvePrimarySelectionSourceRow,
} from "./savePatientCaseDetailsGridSelection.utils";

type CaseDetailsApiRow = CaseDetailsResponseRowDTO;

const LAST_CASE_GRID_ROW_INDEX = defaultCaseDailyDataTemplate.length - 1;

const cloneDefaultCaseDailyRow = (index: number): CaseDetailsData => {
  const templateRow = defaultCaseDailyDataTemplate[index];

  return {
    ...templateRow,
    index,
    fluids: cloneCells(templateRow.fluids),
    medicines: cloneCells(templateRow.medicines),
    foodExtras: cloneCells(templateRow.foodExtras),
    examinations: cloneCells(templateRow.examinations),
    procedures: cloneCells(templateRow.procedures),
  };
};

export const mapCaseDetailsGridToDto = (
  rows: CaseDetailsData[][],
): CaseDetailsDataSchema[][] =>
  rows.map((dailyRows) => {
    const orderedRows = sortCaseDayRowsByIndex(dailyRows);
    const rowForFallback = getCaseDayPrimaryDataRow(orderedRows);
    const fallbackDate =
      normalizeCaseDetailsDate(rowForFallback?.date) ?? toDateKey(new Date());
    const startTime = normalizeCaseDetailsTime(rowForFallback?.time) ?? "00:00";
    const startHour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);

    return orderedRows.map((row) => {
      const rowIndex =
        Number.isInteger(row.index) && row.index >= 0
          ? row.index
          : CASE_GRID_FIRST_DATA_COLUMN_INDEX;

      return mapCaseDetailsRowToDto(
        row,
        fallbackDate,
        getCaseGridExpectedHourByIndex(startHour, rowIndex),
      );
    });
  });

const shouldOffsetPersistedRowIndexes = (
  dailyRows: CaseDetailsApiRow[],
): boolean =>
  !dailyRows.some((row) => Number(row.index) >= LAST_CASE_GRID_ROW_INDEX);

const toUiRowIndex = (
  row: CaseDetailsApiRow,
  shouldOffsetIndexes: boolean,
): number | null => {
  const normalizedIndex = Number(row.index);
  if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) {
    return null;
  }

  const uiIndex = shouldOffsetIndexes
    ? normalizedIndex + CASE_GRID_FIRST_DATA_COLUMN_INDEX
    : normalizedIndex;

  if (uiIndex >= defaultCaseDailyDataTemplate.length) {
    return null;
  }

  return uiIndex;
};

const getCaseDaySortDate = (caseDay: CaseDetailsData[]): string | null =>
  normalizeCaseDetailsDate(getCaseDayPrimaryDataRow(caseDay)?.date) ?? null;

const sortCaseDetailsDaysByDate = (
  caseDetailsList: CaseDetailsData[][],
): CaseDetailsData[][] =>
  [...caseDetailsList].sort((left, right) => {
    const leftDate = getCaseDaySortDate(left);
    const rightDate = getCaseDaySortDate(right);

    if (leftDate && rightDate) {
      return rightDate.localeCompare(leftDate);
    }
    if (leftDate) {
      return -1;
    }
    if (rightDate) {
      return 1;
    }

    return 0;
  });

const mapCaseDetailsApiDailyRowsToUi = (
  dailyRows: CaseDetailsApiRow[],
): CaseDetailsData[] => {
  const rowByIndex = new Map<number, CaseDetailsApiRow>();
  const shouldOffsetIndexes = shouldOffsetPersistedRowIndexes(dailyRows);

  for (const row of dailyRows) {
    const uiIndex = toUiRowIndex(row, shouldOffsetIndexes);
    if (uiIndex === null) {
      continue;
    }

    rowByIndex.set(uiIndex, row);
  }

  const mappedRows = defaultCaseDailyDataTemplate.map((_, index) => {
    const row = rowByIndex.get(index);
    if (!row) {
      return cloneDefaultCaseDailyRow(index);
    }

    return {
      ...cloneDefaultCaseDailyRow(index),
      ...mapCaseDetailsApiRowToUiRow(row),
      index,
    };
  });

  const selectionSourceRow = resolvePrimarySelectionSourceRow(mappedRows);
  if (selectionSourceRow) {
    mappedRows[0] = buildPrimarySelectionRow(
      mappedRows,
      selectionSourceRow,
      cloneDefaultCaseDailyRow(0),
    );
  }

  const normalizedRows = normalizeDailyRowsByPrimarySelection(mappedRows);
  const startHour = resolveCaseDayStartHour(normalizedRows);

  if (startHour === null) {
    return normalizedRows;
  }

  return normalizedRows.map((row) => {
    if (row.time && row.time !== "") {
      return row;
    }

    return {
      ...row,
      time: getCaseGridExpectedHourByIndex(startHour, row.index),
    };
  });
};

export const mapCaseDetailsApiGridToUi = (
  caseDailyDetails: CaseDetailsResponseDTO["caseDailyDetails"],
): CaseDetailsData[][] | null =>
  caseDailyDetails
    ? sortCaseDetailsDaysByDate(
        caseDailyDetails.map(mapCaseDetailsApiDailyRowsToUi),
      )
    : null;
