import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type {
  CaseDetailsData,
  CaseDetailsFieldName,
  CaseDetailsFieldValue,
  CaseDetailsMedicineCell,
  CaseDetailsOptionCell,
} from "../CaseDetailsTable.types";
import type {
  MedicineSectionType,
  OptionSectionType,
} from "../CaseDetailsTable.constants";
import { getCaseDayPrimaryDataRow, getCaseGridExpectedHourByIndex } from "../caseGrid.utils";
import {
  getCheckboxesValuesAfterOptionsSelection,
  getCheckboxesValuesAfterOptionsSelectionForOptions,
} from "./caseDetailsSelection.utils";
import { toCaseDetailsMedicineCell, toTodayDate } from "./CaseDetailsTable.utils";

export const updateCaseDetailsFieldValue = (
  currentDayRows: CaseDetailsData[],
  rowIndex: number,
  fieldName: CaseDetailsFieldName,
  value: CaseDetailsFieldValue,
): CaseDetailsData[] | null => {
  const targetRow = currentDayRows[rowIndex];
  if (!targetRow || !(fieldName in targetRow)) {
    return null;
  }

  const nextDayRows = [...currentDayRows];
  nextDayRows[rowIndex] = {
    ...targetRow,
    [fieldName]: value,
  };

  return nextDayRows;
};

export const applySelectedStartHourToDay = (
  currentDayRows: CaseDetailsData[],
  startHour: number,
): CaseDetailsData[] => {
  const rowForDate = getCaseDayPrimaryDataRow(currentDayRows);
  const resolvedDate =
    rowForDate?.date && rowForDate.date.trim().length > 0
      ? rowForDate.date
      : toTodayDate();

  return currentDayRows.map((row) => {
    const parsedIndex = Number(row.index);
    const normalizedColumnIndex =
      Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 1;

    return {
      ...row,
      date: resolvedDate,
      time: getCaseGridExpectedHourByIndex(startHour, normalizedColumnIndex),
    };
  });
};

export const applyMedicineSelectionToDay = (
  currentDayRows: CaseDetailsData[],
  medicineCellType: MedicineSectionType,
  selectedMedicines: MedicineSelectOptionObj[],
): CaseDetailsData[] => {
  const selectedCells = selectedMedicines.map(toCaseDetailsMedicineCell);

  return currentDayRows.map((details, rowIndex) => {
    const nextValues: CaseDetailsMedicineCell[] =
      rowIndex === 0
        ? selectedCells
        : getCheckboxesValuesAfterOptionsSelection(
            selectedCells,
            details[medicineCellType],
          );

    return {
      ...details,
      [medicineCellType]: nextValues,
    };
  });
};

export const applyOptionSelectionToDay = (
  currentDayRows: CaseDetailsData[],
  optionCellType: OptionSectionType,
  selectedOptions: SelectOptionsPickerOptionObj[],
): CaseDetailsData[] =>
  currentDayRows.map((details, rowIndex) => {
    const currentValues = details[optionCellType];
    const nextValues: CaseDetailsOptionCell[] =
      rowIndex === 0
        ? selectedOptions
        : getCheckboxesValuesAfterOptionsSelectionForOptions(
            selectedOptions,
            currentValues,
          );

    return {
      ...details,
      [optionCellType]: nextValues,
    };
  });
