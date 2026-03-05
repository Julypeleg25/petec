import type { SelectOptionObj } from "../../../../../utils/FormSelect/FormSelect.types";
import {
  getDateForInput,
  getFormattedDate,
  getFormattedDateFromDBdate,
} from "../../../../../utils/DateFormattingUtil";
import type { CaseDetailsData } from "../../../CaseDetailsTable/CaseDetailsTable.types";
import { getCaseDayPrimaryDataRow } from "../../../CaseDetailsTable/caseGrid.utils";
import { SAVE_PATIENT_DEFAULTS } from "../../constants/savePatient.constants";

export interface CaseDateSelectionData {
  caseDetailsIndex: number;
  selectedHour: string;
}

const resolveCaseDate = (
  caseDetails: CaseDetailsData[],
): string | undefined => {
  const rawDate = getCaseDayPrimaryDataRow(caseDetails)?.date;
  return rawDate && rawDate.trim().length > 0 ? rawDate : undefined;
};

export const getCaseDateSelectionKey = (
  caseDetails: CaseDetailsData[],
  index: number,
): string => {
  const resolvedDate = resolveCaseDate(caseDetails);
  if (resolvedDate) {
    return resolvedDate;
  }
  return `new-day-${index}`;
};

export const buildCaseDetailsDateOptions = (
  caseDetailsList: CaseDetailsData[][],
): SelectOptionObj[] => {
  if (caseDetailsList.length === 0) {
    return [];
  }

  const defaultDateText = getFormattedDate(new Date());

  return caseDetailsList.map((caseDetails, index) => {
    const caseDate = resolveCaseDate(caseDetails);
    return {
      value: getCaseDateSelectionKey(caseDetails, index),
      text: caseDate ? getFormattedDateFromDBdate(caseDate) : defaultDateText,
    };
  });
};

export const getCaseDateSelectionData = (
  caseDetailsList: CaseDetailsData[][],
  selectedValue: string,
): CaseDateSelectionData => {
  const caseDetailsIndex = caseDetailsList.findIndex(
    (caseDetails, index) =>
      getCaseDateSelectionKey(caseDetails, index) === selectedValue,
  );

  const selectedCase = caseDetailsList[caseDetailsIndex];

  return {
    caseDetailsIndex,
    selectedHour: (() => {
      if (!selectedCase) return SAVE_PATIENT_DEFAULTS.EMPTY_VALUE;
      const rowForHour = getCaseDayPrimaryDataRow(selectedCase);
      const hourRaw = rowForHour?.time.split(":")[0] || "";
      const parsedHour = Number(hourRaw);
      return Number.isFinite(parsedHour)
        ? String(parsedHour)
        : SAVE_PATIENT_DEFAULTS.EMPTY_VALUE;
    })(),
  };
};

export const resolveSelectedCaseDate = (
  caseDetailsList: CaseDetailsData[][],
  caseDetailsIndex: number,
): string => {
  if (caseDetailsIndex < 0 || caseDetailsIndex >= caseDetailsList.length) {
    return SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK;
  }

  const selectedCase = caseDetailsList[caseDetailsIndex];
  const resolvedDate = resolveCaseDate(selectedCase);
  if (resolvedDate) {
    return resolvedDate;
  }

  return getDateForInput(new Date());
};
