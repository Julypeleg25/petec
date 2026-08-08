import type React from "react";
import type {
  CaseDetailsCellClickHandler,
  CaseDetailsData,
  CaseDetailsInteractiveStateProps,
  CaseDetailsMedicineCell,
  CaseDetailsOptionCell,
  CaseDetailsStateSetter,
} from "../CaseDetailsTable.types";
import type {
  MedicineSectionType,
  OptionSectionType,
} from "../CaseDetailsTable.constants";
import { getRequiredIndexesByFrequency } from "../utils/caseDetailsFrequency.utils";

interface ToggleKeyFields {
  isRequiredKey: keyof CaseDetailsData;
  isEditableKey: keyof CaseDetailsData;
}
type ToggleKeys = Readonly<ToggleKeyFields>;

interface CellWithValue {
  value: string;
}

interface SelectCommentKeys {
  typeIdKey: keyof CaseDetailsData;
  commentsKey: keyof CaseDetailsData;
}

interface BooleanCommentKeys {
  valueKey: keyof CaseDetailsData;
  commentsKey: keyof CaseDetailsData;
}

interface SimpleCellToggleState {
  toggleKeys: ToggleKeys;
  isCellRequired: boolean;
  isCellEditable: boolean;
}

export type CaseDetailsCollectionKey =
  keyof Pick<
    CaseDetailsData,
    "fluids" | "medicines" | "procedures" | "foodExtras" | "examinations"
  >;
export type CaseDetailsMedicineCollectionKey = Extract<
  CaseDetailsCollectionKey,
  MedicineSectionType
>;
export type CaseDetailsOptionCollectionKey = Extract<
  CaseDetailsCollectionKey,
  OptionSectionType
>;
export type CaseDetailsSelectCommentPrefix = "urine" | "feces";
export type CaseDetailsBooleanCommentPrefix = "puke";
export type CaseDetailsCollectionItem<K extends CaseDetailsCollectionKey> =
  CaseDetailsData[K][number];

type CaseDetailsRowUpdater = (row: CaseDetailsData) => CaseDetailsData;
type CaseDetailsCollectionUpdater<K extends CaseDetailsCollectionKey> = (
  collection: CaseDetailsData[K],
) => CaseDetailsData[K];
type CaseDetailsCollectionItemUpdater<K extends CaseDetailsCollectionKey> = (
  item: CaseDetailsCollectionItem<K>,
) => CaseDetailsCollectionItem<K>;

export const getToggleKeys = (baseKey: string): ToggleKeys => {
  const capTarget = "IsRequired";
  const editTarget = "IsEditable";

  return {
    isRequiredKey: `${baseKey}${capTarget}` as keyof CaseDetailsData,
    isEditableKey: `${baseKey}${editTarget}` as keyof CaseDetailsData,
  };
};

export const resolveBooleanSetterValue = (
  valueOrUpdater: boolean | ((previousValue: boolean) => boolean),
  previousValue = false,
): boolean =>
  typeof valueOrUpdater === "function"
    ? valueOrUpdater(previousValue)
    : valueOrUpdater;

export const findCellByValue = <T extends CellWithValue>(
  cells: T[],
  value: string,
): T | undefined => cells.find((cell) => cell.value === value);

export const getSimpleCellToggleState = (
  row: CaseDetailsData,
  baseKey: string,
): SimpleCellToggleState => {
  const toggleKeys = getToggleKeys(baseKey);

  return {
    toggleKeys,
    isCellRequired: row[toggleKeys.isRequiredKey] as boolean,
    isCellEditable: row[toggleKeys.isEditableKey] as boolean,
  };
};

export const getSelectCommentKeys = (
  prefix: CaseDetailsSelectCommentPrefix,
): SelectCommentKeys => ({
  typeIdKey: `${prefix}TypeId` as keyof CaseDetailsData,
  commentsKey: `${prefix}Comments` as keyof CaseDetailsData,
});

export const getBooleanCommentKeys = (
  prefix: CaseDetailsBooleanCommentPrefix,
): BooleanCommentKeys => ({
  valueKey: `is${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}` as keyof CaseDetailsData,
  commentsKey: `${prefix}Comments` as keyof CaseDetailsData,
});

export const getMedicineCells = (
  row: CaseDetailsData,
  type: CaseDetailsMedicineCollectionKey,
): CaseDetailsMedicineCell[] => row[type];

export const getOptionCells = (
  row: CaseDetailsData,
  type: CaseDetailsOptionCollectionKey,
): CaseDetailsOptionCell[] => row[type];

export const getHeaderCollectionItem = <K extends CaseDetailsCollectionKey>(
  caseDetailsList: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  collectionKey: K,
  rowIndex: number,
): CaseDetailsCollectionItem<K> | undefined =>
  caseDetailsList[caseDetailsDataIndex]?.[0]?.[collectionKey]?.[rowIndex];

export const findCollectionItemInCell = <K extends CaseDetailsCollectionKey>(
  caseDetailsList: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  columnIndex: number,
  collectionKey: K,
  itemValue: string,
): CaseDetailsCollectionItem<K> | undefined => {
  const row = caseDetailsList[caseDetailsDataIndex]?.[columnIndex];
  const cells = row?.[collectionKey];

  if (!cells) {
    return undefined;
  }

  return cells.find(
    (item) => item.value === itemValue,
  ) as CaseDetailsCollectionItem<K> | undefined;
};

export const stopCaseDetailsEventPropagation = (
  event: React.SyntheticEvent,
): void => {
  event.stopPropagation();
};

export const updateCaseDetailsRow = (
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  updater: CaseDetailsRowUpdater,
): CaseDetailsData[][] => {
  const currentDayRows = previousState[caseDetailsDataIndex];
  const currentRow = currentDayRows?.[cellIndex];

  if (!currentDayRows || !currentRow) {
    return previousState;
  }

  const nextState = [...previousState];
  const nextDayRows = [...currentDayRows];
  nextDayRows[cellIndex] = updater(currentRow);
  nextState[caseDetailsDataIndex] = nextDayRows;
  return nextState;
};

export const updateCaseDetailsCollection = <
  K extends CaseDetailsCollectionKey,
>(
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: K,
  updater: CaseDetailsCollectionUpdater<K>,
): CaseDetailsData[][] =>
  updateCaseDetailsRow(
    previousState,
    caseDetailsDataIndex,
    cellIndex,
    (row) => ({
      ...row,
      [collectionKey]: updater(row[collectionKey]),
    }),
  );

export const updateMedicineCollection = (
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsMedicineCollectionKey,
  updater: (
    collection: CaseDetailsMedicineCell[],
  ) => CaseDetailsMedicineCell[],
): CaseDetailsData[][] =>
  updateCaseDetailsCollection(
    previousState,
    caseDetailsDataIndex,
    cellIndex,
    collectionKey,
    updater,
  );

export const updateOptionCollection = (
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsOptionCollectionKey,
  updater: (collection: CaseDetailsOptionCell[]) => CaseDetailsOptionCell[],
): CaseDetailsData[][] =>
  updateCaseDetailsCollection(
    previousState,
    caseDetailsDataIndex,
    cellIndex,
    collectionKey,
    updater,
  );

export const updateCollectionItemByValue = <
  K extends CaseDetailsCollectionKey,
>(
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: K,
  itemValue: string,
  updater: CaseDetailsCollectionItemUpdater<K>,
): CaseDetailsData[][] =>
  updateCaseDetailsCollection(
    previousState,
    caseDetailsDataIndex,
    cellIndex,
    collectionKey,
    (collection) =>
      collection.map((item) =>
        item.value === itemValue ? updater(item) : item,
      ) as CaseDetailsData[K],
  );

export const applySimpleCellToggle = (
  setCaseDetailsList: CaseDetailsStateSetter,
  caseDetailsDataIndex: number,
  cellIndex: number,
  paintingMode: boolean,
  keys: ToggleKeys,
  value: boolean,
): void => {
  setCaseDetailsList((prevState) => {
    return updateCaseDetailsRow(
      prevState,
      caseDetailsDataIndex,
      cellIndex,
      (row) => {
        const targetKey = paintingMode
          ? keys.isRequiredKey
          : keys.isEditableKey;

        return {
          ...row,
          [targetKey]: value,
        };
      },
    );
  });
};

export const handleSimpleCellToggle = (
  e: React.MouseEvent<HTMLElement>,
  isCellEditable: boolean,
  isCellRequired: boolean,
  handleCellClick: CaseDetailsCellClickHandler,
  setCaseDetailsList: CaseDetailsStateSetter,
  caseDetailsDataIndex: number,
  cellIndex: number,
  paintingMode: boolean,
  keys: ToggleKeys,
): void => {
  const target = e.target as HTMLElement;
  if (
    target.closest(".case-details-pop-up") ||
    target.closest(".case-details-pop-up-on-double-click")
  ) {
    return;
  }

  void handleCellClick(e, isCellEditable, isCellRequired).then((value) => {
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

export const applyOptionCellToggle = (
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsOptionCollectionKey,
  itemKey: string,
  paintingMode: boolean,
  value: boolean,
): CaseDetailsData[][] =>
  updateOptionCollection(
    previousState,
    caseDetailsDataIndex,
    cellIndex,
    collectionKey,
    (cells) =>
      cells.map((cell) =>
        cell.value === itemKey
          ? {
            ...cell,
            isRequired: paintingMode ? value : cell.isRequired,
            isEditable: paintingMode ? cell.isEditable : value,
          }
          : cell,
      ),
  );

export const handleOptionCellToggle = (
  e: React.MouseEvent<HTMLElement>,
  isCellEditable: boolean,
  isCellRequired: boolean,
  handleCellClick: CaseDetailsCellClickHandler,
  setCaseDetailsList: CaseDetailsStateSetter,
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsOptionCollectionKey,
  itemKey: string,
  paintingMode: boolean,
): void => {
  const target = e.target as HTMLElement;
  if (
    target.closest(".case-details-pop-up") ||
    target.closest(".case-details-pop-up-on-double-click")
  ) {
    return;
  }

  void handleCellClick(e, isCellEditable, isCellRequired).then((value) => {
    if (value === null) {
      return;
    }

    setCaseDetailsList((prevState) =>
      applyOptionCellToggle(
        prevState,
        caseDetailsDataIndex,
        cellIndex,
        collectionKey,
        itemKey,
        paintingMode,
        value,
      ),
    );
  });
};

export const applyMedicineCellToggle = (
  previousState: CaseDetailsData[][],
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsMedicineCollectionKey,
  itemKey: string,
  paintingMode: boolean,
  value: boolean,
  frequencyText: string,
): CaseDetailsData[][] => {
  const requiredIndexes = value
    ? getRequiredIndexesByFrequency(frequencyText, cellIndex)
    : [cellIndex];
  let nextState = previousState;

  if (collectionKey === "fluids") {
    if (paintingMode) {
      for (const targetColIndex of requiredIndexes) {
        nextState = updateMedicineCollection(
          nextState,
          caseDetailsDataIndex,
          targetColIndex,
          collectionKey,
          (cells) =>
            cells.map((cell) => ({
              ...cell,
              isRequired: value,
            })),
        );
      }

      return nextState;
    }

    return updateMedicineCollection(
      nextState,
      caseDetailsDataIndex,
      cellIndex,
      collectionKey,
      (cells) =>
        cells.map((cell) => ({
          ...cell,
          isEditable: value,
        })),
    );
  }

  if (paintingMode) {
    for (const targetColIndex of requiredIndexes) {
      nextState = updateMedicineCollection(
        nextState,
        caseDetailsDataIndex,
        targetColIndex,
        collectionKey,
        (cells) =>
          cells.map((cell) =>
            cell.value === itemKey ? { ...cell, isRequired: value } : cell,
          ),
      );
    }

    return nextState;
  }

  return updateMedicineCollection(
    nextState,
    caseDetailsDataIndex,
    cellIndex,
    collectionKey,
    (cells) =>
      cells.map((cell) =>
        cell.value === itemKey ? { ...cell, isEditable: value } : cell,
      ),
  );
};

export const handleMedicineCellToggle = (
  e: React.MouseEvent<HTMLElement>,
  isCellEditable: boolean,
  isCellRequired: boolean,
  handleCellClick: CaseDetailsCellClickHandler,
  setCaseDetailsList: CaseDetailsStateSetter,
  caseDetailsDataIndex: number,
  cellIndex: number,
  collectionKey: CaseDetailsMedicineCollectionKey,
  itemKey: string,
  paintingMode: boolean,
  frequencyText: string,
): void => {
  const target = e.target as HTMLElement;
  if (
    target.closest(".case-details-pop-up") ||
    target.closest(".case-details-pop-up-on-double-click")
  ) {
    return;
  }

  void handleCellClick(e, isCellEditable, isCellRequired).then((value) => {
    if (value === null) {
      return;
    }

    setCaseDetailsList((prevState) =>
      applyMedicineCellToggle(
        prevState,
        caseDetailsDataIndex,
        cellIndex,
        collectionKey,
        itemKey,
        paintingMode,
        value,
        frequencyText,
      ),
    );
  });
};

export const haveInteractiveStatePropsChanged = (
  previousProps: Pick<
    CaseDetailsInteractiveStateProps,
    "caseDetailsDataIndex" | "paintingMode" | "handleCellClick"
  >,
  nextProps: Pick<
    CaseDetailsInteractiveStateProps,
    "caseDetailsDataIndex" | "paintingMode" | "handleCellClick"
  >,
): boolean =>
  previousProps.caseDetailsDataIndex !== nextProps.caseDetailsDataIndex ||
  previousProps.paintingMode !== nextProps.paintingMode ||
  previousProps.handleCellClick !== nextProps.handleCellClick;

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
