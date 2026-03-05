import type React from "react";
import type { CaseDetailsData } from "../CaseDetailsTable.types";

export type CaseDetailsCellClickHandler = (
  e: React.MouseEvent<HTMLElement>,
  isEditable: boolean,
) => Promise<boolean | null>;

type ToggleKeys = Readonly<{
  isRequiredKey: keyof CaseDetailsData;
  isEditableKey: keyof CaseDetailsData;
}>;

export const getToggleKeys = (baseKey: string): ToggleKeys => ({
  isRequiredKey: `${baseKey}_is_required` as keyof CaseDetailsData,
  isEditableKey: `${baseKey}_is_editable` as keyof CaseDetailsData,
});

export const resolveBooleanSetterValue = (
  valueOrUpdater: boolean | ((previousValue: boolean) => boolean),
  previousValue = false,
): boolean =>
  typeof valueOrUpdater === "function"
    ? valueOrUpdater(previousValue)
    : valueOrUpdater;

export const findCellByValue = <T extends { value: string }>(
  cells: T[],
  value: string,
): T | undefined => cells.find((cell) => cell.value === value);

export const applySimpleCellToggle = (
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>,
  caseDetailsDataIndex: number,
  cellIndex: number,
  paintingMode: boolean,
  keys: ToggleKeys,
  value: boolean,
): void => {
  setCaseDetailsList((prevState) => {
    const newState = [...prevState];
    if (paintingMode) {
      (newState[caseDetailsDataIndex][cellIndex][
        keys.isRequiredKey
      ] as boolean) = value;
    } else {
      (newState[caseDetailsDataIndex][cellIndex][
        keys.isEditableKey
      ] as boolean) = value;
    }
    return newState;
  });
};

export const handleSimpleCellToggle = (
  e: React.MouseEvent<HTMLElement>,
  isCellEditable: boolean,
  handleCellClick: CaseDetailsCellClickHandler,
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>,
  caseDetailsDataIndex: number,
  cellIndex: number,
  paintingMode: boolean,
  keys: ToggleKeys,
): void => {
  void handleCellClick(e, isCellEditable).then((value) => {
    if (value === null) {
      return;
    }
    applySimpleCellToggle(
      setCaseDetailsList,
      caseDetailsDataIndex,
      cellIndex,
      paintingMode,
      keys,
      value,
    );
  });
};

export const areSimpleRowCellsEqual = (
  previousCaseDetailsList: CaseDetailsData[][],
  nextCaseDetailsList: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  columnCount: number,
  keys: readonly (keyof CaseDetailsData)[],
): boolean => {
  for (let index = 0; index < columnCount; index++) {
    const previousCell = previousCaseDetailsList[caseDetailsDataIndex]?.[index];
    const nextCell = nextCaseDetailsList[caseDetailsDataIndex]?.[index];

    if (!previousCell || !nextCell) {
      return false;
    }

    for (const key of keys) {
      if (previousCell[key] !== nextCell[key]) {
        return false;
      }
    }
  }

  return true;
};
