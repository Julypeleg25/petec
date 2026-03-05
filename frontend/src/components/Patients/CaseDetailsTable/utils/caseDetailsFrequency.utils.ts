import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";

const frequenciesHours: Record<string, number> = {
  BID: 12,
  TID: 8,
  CRI: 8,
  Q4H: 4,
  Q6H: 6,
  bid: 12,
  tid: 8,
  cri: 8,
  q4h: 4,
  q6h: 6,
};

export const getRequiredIndexesByFrequency = (
  frequency: string,
  colIndex: number,
): number[] => {
  if (!frequency || !(frequency in frequenciesHours)) {
    return [colIndex];
  }

  const indexes: number[] = [];
  let nextIndex = colIndex;
  while (nextIndex < DAILY_CASE_TABLE_COLUMN_COUNT) {
    indexes.push(nextIndex);
    indexes.push(nextIndex);
    nextIndex += frequenciesHours[frequency] / 2;
  }

  return indexes;
};
