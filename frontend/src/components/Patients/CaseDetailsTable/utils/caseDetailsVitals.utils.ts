import type { CaseDetailsData } from "../CaseDetailsTable.types";

export type LatestVitalMarker = {
  value: number;
  dataDetailsIndex: number;
  colIndex: number;
};

export type LatestVitals = {
  T: LatestVitalMarker;
  P: LatestVitalMarker;
  R: LatestVitalMarker;
};

export const isValueInRange = (
  value?: number | null,
  min?: number,
  max?: number,
): boolean => {
  if (value === undefined || value === null) return true;
  if (min === undefined || max === undefined) return true;
  return value >= min && value <= max;
};

const hasNumericString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseNumericCell = (value: unknown): number | null => {
  if (!hasNumericString(value)) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getLatestVitals = (caseDetailsList: CaseDetailsData[][]): LatestVitals => {
  const latestVitals: LatestVitals = {
    T: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
    P: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
    R: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
  };

  let tempFound = false;
  let pulseFound = false;
  let respirationFound = false;

  for (let detailsIndex = 0; detailsIndex < caseDetailsList.length; detailsIndex++) {
    const caseDay = caseDetailsList[detailsIndex];
    for (let colIndex = caseDay.length - 1; colIndex > 0; colIndex--) {
      const row = caseDay[colIndex];
      if (!row) continue;

      if (!tempFound) {
        const temperature = parseNumericCell(row.T);
        if (temperature !== null) {
          latestVitals.T = {
            value: temperature,
            dataDetailsIndex: detailsIndex,
            colIndex,
          };
          tempFound = true;
        }
      }

      if (!pulseFound) {
        const pulse = parseNumericCell(row.P);
        if (pulse !== null) {
          latestVitals.P = {
            value: pulse,
            dataDetailsIndex: detailsIndex,
            colIndex,
          };
          pulseFound = true;
        }
      }

      if (!respirationFound) {
        const respiration = parseNumericCell(row.R);
        if (respiration !== null) {
          latestVitals.R = {
            value: respiration,
            dataDetailsIndex: detailsIndex,
            colIndex,
          };
          respirationFound = true;
        }
      }
    }
  }

  return latestVitals;
};
