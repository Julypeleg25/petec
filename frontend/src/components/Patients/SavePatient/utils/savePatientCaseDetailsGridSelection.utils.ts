import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import { CASE_GRID_FIRST_DATA_COLUMN_INDEX } from "../../CaseDetailsTable/caseGrid.utils";

type CaseDailyDetailsMedicineItem = CaseDetailsData["medicines"][number];
type CaseDailyDetailsOptionItem = CaseDetailsData["foodExtras"][number];
type CaseDailyDetailsExaminationItem = CaseDetailsData["examinations"][number];
type CaseDetailsCollectionValueItem = { value: string };
type CaseDetailsPrimarySelectionCollectionKey =
  keyof Pick<
    CaseDetailsData,
    "fluids" | "medicines" | "foodExtras" | "procedures" | "examinations"
  >;

const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const hasSelectionCollections = (row: CaseDetailsData): boolean =>
  row.fluids.length > 0 ||
  row.medicines.length > 0 ||
  row.foodExtras.length > 0 ||
  row.procedures.length > 0 ||
  row.examinations.length > 0;

const hasDateOrTime = (row: CaseDetailsData): boolean =>
  Boolean(row.date?.trim() || row.time?.trim());

const toPrimarySelectionMedicineCells = (
  cells: CaseDailyDetailsMedicineItem[],
): CaseDailyDetailsMedicineItem[] =>
  cells.map((cell) => ({
    ...cell,
    isGiven: false,
    isRequired: false,
    isEditable: true,
    comment: undefined,
  }));

const toPrimarySelectionOptionCells = (
  cells: CaseDailyDetailsOptionItem[],
): CaseDailyDetailsOptionItem[] =>
  cells.map((cell) => ({
    ...cell,
    isGiven: false,
    isRequired: false,
    isEditable: true,
    comment: null,
  }));

const toPrimarySelectionExaminationCells = (
  cells: CaseDailyDetailsExaminationItem[],
): CaseDailyDetailsExaminationItem[] =>
  cells.map((cell) => ({
    ...cell,
    exam_value: null,
    isRequired: false,
    isEditable: true,
    comment: null,
  }));

export const resolvePrimarySelectionSourceRow = (
  rows: CaseDetailsData[],
): CaseDetailsData | undefined =>
  rows.find(
    (row) =>
      row.index >= CASE_GRID_FIRST_DATA_COLUMN_INDEX &&
      hasSelectionCollections(row),
  ) ??
  rows.find(
    (row) =>
      row.index >= CASE_GRID_FIRST_DATA_COLUMN_INDEX && hasDateOrTime(row),
  ) ??
  rows.find((row) => row.index >= CASE_GRID_FIRST_DATA_COLUMN_INDEX) ??
  rows.find((row) => row.index === 0 && hasSelectionCollections(row)) ??
  rows.find((row) => row.index === 0 && hasDateOrTime(row)) ??
  rows.find((row) => row.index === 0);

const mergeUniqueSelectionItems = <T extends CaseDetailsCollectionValueItem>(
  currentItems: T[],
  nextItems: T[],
  mergeItems: (currentItem: T, nextItem: T) => T,
): T[] => {
  const itemsByValue = new Map(currentItems.map((item) => [item.value, item]));
  const orderedValues = currentItems.map((item) => item.value);

  for (const nextItem of nextItems) {
    const existingItem = itemsByValue.get(nextItem.value);
    if (existingItem) {
      itemsByValue.set(nextItem.value, mergeItems(existingItem, nextItem));
      continue;
    }

    itemsByValue.set(nextItem.value, nextItem);
    orderedValues.push(nextItem.value);
  }

  return orderedValues
    .map((value) => itemsByValue.get(value))
    .filter(isDefined);
};

const mergePrimarySelectionMedicineItem = (
  currentItem: CaseDailyDetailsMedicineItem,
  nextItem: CaseDailyDetailsMedicineItem,
): CaseDailyDetailsMedicineItem => ({
  ...currentItem,
  text: currentItem.text || nextItem.text,
  dosageText: currentItem.dosageText ?? nextItem.dosageText,
  doseAmount: currentItem.doseAmount ?? nextItem.doseAmount,
  measureUnitTypeId: currentItem.measureUnitTypeId ?? nextItem.measureUnitTypeId,
  measureUnitText: currentItem.measureUnitText || nextItem.measureUnitText,
  dosageFrequencyId: currentItem.dosageFrequencyId ?? nextItem.dosageFrequencyId,
  frequencyText: currentItem.frequencyText || nextItem.frequencyText,
  routeOfAdministrationId:
    currentItem.routeOfAdministrationId ?? nextItem.routeOfAdministrationId,
  medicineRouteText:
    currentItem.medicineRouteText || nextItem.medicineRouteText,
  medicineId: currentItem.medicineId ?? nextItem.medicineId,
});

const mergePrimarySelectionOptionItem = (
  currentItem: CaseDailyDetailsOptionItem,
  nextItem: CaseDailyDetailsOptionItem,
): CaseDailyDetailsOptionItem => ({
  ...currentItem,
  text: currentItem.text || nextItem.text,
});

const mergePrimarySelectionExaminationItem = (
  currentItem: CaseDailyDetailsExaminationItem,
  nextItem: CaseDailyDetailsExaminationItem,
): CaseDailyDetailsExaminationItem => ({
  ...currentItem,
  text: currentItem.text || nextItem.text,
});

const getPrimarySelectionMedicineCells = (
  rows: CaseDetailsData[],
  collectionKey: Extract<
    CaseDetailsPrimarySelectionCollectionKey,
    "fluids" | "medicines"
  >,
): CaseDailyDetailsMedicineItem[] => {
  let aggregatedItems: CaseDailyDetailsMedicineItem[] = [];

  for (const row of rows) {
    const selectionItems = toPrimarySelectionMedicineCells(row[collectionKey]);
    aggregatedItems = mergeUniqueSelectionItems(
      aggregatedItems,
      selectionItems,
      mergePrimarySelectionMedicineItem,
    );
  }

  return aggregatedItems;
};

const getPrimarySelectionOptionCells = (
  rows: CaseDetailsData[],
  collectionKey: Extract<
    CaseDetailsPrimarySelectionCollectionKey,
    "foodExtras" | "procedures"
  >,
): CaseDailyDetailsOptionItem[] => {
  let aggregatedItems: CaseDailyDetailsOptionItem[] = [];

  for (const row of rows) {
    const selectionItems = toPrimarySelectionOptionCells(row[collectionKey]);
    aggregatedItems = mergeUniqueSelectionItems(
      aggregatedItems,
      selectionItems,
      mergePrimarySelectionOptionItem,
    );
  }

  return aggregatedItems;
};

const getPrimarySelectionExaminationCells = (
  rows: CaseDetailsData[],
): CaseDailyDetailsExaminationItem[] => {
  let aggregatedItems: CaseDailyDetailsExaminationItem[] = [];

  for (const row of rows) {
    const selectionItems = toPrimarySelectionExaminationCells(row.examinations);
    aggregatedItems = mergeUniqueSelectionItems(
      aggregatedItems,
      selectionItems,
      mergePrimarySelectionExaminationItem,
    );
  }

  return aggregatedItems;
};

export const buildPrimarySelectionRow = (
  rows: CaseDetailsData[],
  sourceRow: CaseDetailsData,
  fallbackRow: CaseDetailsData,
): CaseDetailsData => ({
  ...fallbackRow,
  date: sourceRow.date,
  time: sourceRow.time,
  fluids: getPrimarySelectionMedicineCells(rows, "fluids"),
  medicines: getPrimarySelectionMedicineCells(rows, "medicines"),
  foodExtras: getPrimarySelectionOptionCells(rows, "foodExtras"),
  procedures: getPrimarySelectionOptionCells(rows, "procedures"),
  examinations: getPrimarySelectionExaminationCells(rows),
});

const normalizeDailyMedicineCells = (
  sourceCells: CaseDailyDetailsMedicineItem[],
  currentCells: CaseDailyDetailsMedicineItem[],
): CaseDailyDetailsMedicineItem[] => {
  const currentByValue = new Map(currentCells.map((cell) => [cell.value, cell]));

  return sourceCells.map((sourceCell) => {
    const currentCell = currentByValue.get(sourceCell.value);
    if (!currentCell) {
      return {
        ...sourceCell,
        isGiven: false,
        isRequired: false,
        isEditable: true,
      };
    }

    return {
      ...sourceCell,
      isGiven: currentCell.isGiven ?? false,
      isRequired: currentCell.isRequired ?? false,
      isEditable: currentCell.isEditable ?? true,
      comment: currentCell.comment ?? undefined,
    };
  });
};

const normalizeDailyOptionCells = (
  sourceCells: CaseDailyDetailsOptionItem[],
  currentCells: CaseDailyDetailsOptionItem[],
): CaseDailyDetailsOptionItem[] => {
  const currentByValue = new Map(currentCells.map((cell) => [cell.value, cell]));

  return sourceCells.map((sourceCell) => {
    const currentCell = currentByValue.get(sourceCell.value);
    if (!currentCell) {
      return {
        ...sourceCell,
        isGiven: false,
        isRequired: false,
        isEditable: true,
        comment: null,
      };
    }

    return {
      ...sourceCell,
      isGiven: currentCell.isGiven ?? false,
      isRequired: currentCell.isRequired ?? false,
      isEditable: currentCell.isEditable ?? true,
      comment: currentCell.comment ?? null,
    };
  });
};

const normalizeDailyExaminationCells = (
  sourceCells: CaseDailyDetailsExaminationItem[],
  currentCells: CaseDailyDetailsExaminationItem[],
): CaseDailyDetailsExaminationItem[] => {
  const currentByValue = new Map(currentCells.map((cell) => [cell.value, cell]));

  return sourceCells.map((sourceCell) => {
    const currentCell = currentByValue.get(sourceCell.value);
    if (!currentCell) {
      return {
        ...sourceCell,
        exam_value: null,
        isRequired: false,
        isEditable: true,
        comment: null,
      };
    }

    return {
      ...sourceCell,
      exam_value: currentCell.exam_value ?? null,
      isRequired: currentCell.isRequired ?? false,
      isEditable: currentCell.isEditable ?? true,
      comment: currentCell.comment ?? null,
    };
  });
};

export const normalizeDailyRowsByPrimarySelection = (
  rows: CaseDetailsData[],
): CaseDetailsData[] => {
  const firstRow = rows[0];
  if (!firstRow) {
    return rows;
  }

  return rows.map((row, index) => {
    if (index === 0) {
      return row;
    }

    return {
      ...row,
      fluids: normalizeDailyMedicineCells(firstRow.fluids, row.fluids),
      medicines: normalizeDailyMedicineCells(firstRow.medicines, row.medicines),
      foodExtras: normalizeDailyOptionCells(firstRow.foodExtras, row.foodExtras),
      procedures: normalizeDailyOptionCells(firstRow.procedures, row.procedures),
      examinations: normalizeDailyExaminationCells(
        firstRow.examinations,
        row.examinations,
      ),
    };
  });
};
