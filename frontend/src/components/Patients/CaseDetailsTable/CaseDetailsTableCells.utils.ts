import type { CaseDetailsData } from "./CaseDetailsTable.types";

export type MedicineCommentsById = Record<string, { comment?: string | null }>;

type CaseDetailsStringFields = CaseDetailsData & Record<string, string | null>;
type CaseDetailsMedicineFields = CaseDetailsData &
  Record<string, MedicineCommentsById>;

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
  const typedDetails = details as CaseDetailsMedicineFields;
  return typedDetails[fieldName];
};
