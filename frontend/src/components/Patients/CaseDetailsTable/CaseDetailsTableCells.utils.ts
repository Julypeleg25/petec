import type { CaseDetailsData } from "./CaseDetailsTable.types";

interface MedicineCommentEntry {
  comment?: string | null;
}

export type MedicineCommentsById = Record<string, MedicineCommentEntry>;

type CaseDetailsStringFields = CaseDetailsData & Record<string, string | null>;
type CaseDetailsMedicineCell = CaseDetailsData["medicines"][number];
type CaseDetailsMedicineCollection = CaseDetailsData["medicines"];

const getMedicineComment = (
  cell: CaseDetailsMedicineCell,
): string | null => cell.comment ?? null;

export const getCaseDetailsStringFieldValue = (
  details: CaseDetailsData,
  fieldName: string,
): string | null => {
  const typedDetails = details as CaseDetailsStringFields;
  return typedDetails[fieldName];
};

export const getCaseDetailsMedicineCommentsByType = (
  details: CaseDetailsData,
  fieldName: string,
): MedicineCommentsById | undefined => {
  const typedDetails = details as CaseDetailsData &
    Record<
      string,
      | CaseDetailsMedicineCollection
      | string
      | number
      | boolean
      | null
      | undefined
    >;
  const rawValue = typedDetails[fieldName];
  if (!Array.isArray(rawValue)) {
    return undefined;
  }

  const commentsById: MedicineCommentsById = {};
  for (const item of rawValue as CaseDetailsMedicineCollection) {
    const cell = item as CaseDetailsMedicineCell;
    const cellId = cell.value;
    if (!cellId) {
      continue;
    }
    commentsById[cellId] = { comment: getMedicineComment(cell) };
  }

  return commentsById;
};
