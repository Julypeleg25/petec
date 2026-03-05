import type { CaseDetailsData } from "./CaseDetailsTable.types";

export const CASE_GRID_TITLE_COLUMN_INDEX = 0;
export const CASE_GRID_FIRST_DATA_COLUMN_INDEX = 1;
export const CASE_GRID_HOUR_STEP = 2;

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const normalize24Hour = (value: number): number => ((value % 24) + 24) % 24;

export const normalizeCaseGridTime = (value?: string | null): string | null => {
  if (!value) return null;
  const match = TIME_REGEX.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const parseCaseGridHour = (value?: string | null): number | null => {
  const normalized = normalizeCaseGridTime(value);
  if (!normalized) return null;
  return Number(normalized.split(":")[0]);
};

export const toCaseGridHourCellValue = (hour: number): string =>
  `${String(normalize24Hour(hour)).padStart(2, "0")}:00`;

export const getCaseDayRowByIndex = (
  caseDay: CaseDetailsData[],
  rowIndex: number,
): CaseDetailsData | undefined =>
  caseDay.find((row) => Number(row.index) === rowIndex);

export const getCaseDayPrimaryDataRow = (
  caseDay: CaseDetailsData[],
): CaseDetailsData | undefined =>
  getCaseDayRowByIndex(caseDay, CASE_GRID_FIRST_DATA_COLUMN_INDEX) ??
  getCaseDayRowByIndex(caseDay, CASE_GRID_TITLE_COLUMN_INDEX);

export const sortCaseDayRowsByIndex = (
  caseDay: CaseDetailsData[],
): CaseDetailsData[] =>
  [...caseDay].sort((left, right) => Number(left.index) - Number(right.index));

export const buildCaseDayRowsByIndexMap = (
  caseDay: CaseDetailsData[],
): Map<number, CaseDetailsData> => {
  const rowsByIndex = new Map<number, CaseDetailsData>();

  for (const row of caseDay) {
    const parsedIndex = Number(row.index);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      continue;
    }

    if (!rowsByIndex.has(parsedIndex)) {
      rowsByIndex.set(parsedIndex, row);
    }
  }

  return rowsByIndex;
};

export const getCaseGridExpectedHourByIndex = (
  startHour: number,
  rowIndex: number,
): string => {
  const normalizedRowIndex =
    rowIndex <= CASE_GRID_FIRST_DATA_COLUMN_INDEX
      ? CASE_GRID_FIRST_DATA_COLUMN_INDEX
      : rowIndex;
  const hour = normalize24Hour(
    startHour +
      (normalizedRowIndex - CASE_GRID_FIRST_DATA_COLUMN_INDEX) *
        CASE_GRID_HOUR_STEP,
  );

  return `${String(hour).padStart(2, "0")}:00`;
};

export const resolveCaseDayStartHour = (
  caseDay: CaseDetailsData[],
): number | null => {
  const rowsByIndex = buildCaseDayRowsByIndexMap(caseDay);

  const firstDataRowHour = parseCaseGridHour(
    rowsByIndex.get(CASE_GRID_FIRST_DATA_COLUMN_INDEX)?.time ?? null,
  );
  if (firstDataRowHour !== null) {
    return firstDataRowHour;
  }

  const sortedDataIndexes = Array.from(rowsByIndex.keys())
    .filter((rowIndex) => rowIndex >= CASE_GRID_FIRST_DATA_COLUMN_INDEX)
    .sort((left, right) => left - right);

  for (const rowIndex of sortedDataIndexes) {
    const hour = parseCaseGridHour(rowsByIndex.get(rowIndex)?.time ?? null);
    if (hour === null) {
      continue;
    }

    return normalize24Hour(
      hour -
        (rowIndex - CASE_GRID_FIRST_DATA_COLUMN_INDEX) * CASE_GRID_HOUR_STEP,
    );
  }

  return parseCaseGridHour(
    rowsByIndex.get(CASE_GRID_TITLE_COLUMN_INDEX)?.time ?? null,
  );
};
